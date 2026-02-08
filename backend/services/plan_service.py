import datetime
import random
import os
import json
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
import models
import schemas
from utils.date_utils import get_date_for_day_of_week

EXPORT_PATH = "/app/data/plan.json"

class PlanService:
    @staticmethod
    def get_plan(db: Session, start_date: datetime.date = None, end_date: datetime.date = None):
        q = db.query(models.WeeklyPlanEntry)
        if start_date:
            q = q.filter(models.WeeklyPlanEntry.date >= start_date)
        if end_date:
            q = q.filter(models.WeeklyPlanEntry.date <= end_date)
        return q.order_by(models.WeeklyPlanEntry.date.asc(), models.WeeklyPlanEntry.id.asc()).all()

    @staticmethod
    def add_to_plan(db: Session, item: schemas.PlanItemCreate):
        calculated_date = item.date
        if not calculated_date:
            calculated_date = get_date_for_day_of_week(item.day_of_week)

        db_item = models.WeeklyPlanEntry(
            day_of_week=item.day_of_week,
            meal_type=item.meal_type,
            recipe_id=item.recipe_id,
            portions=item.portions,
            family_member_id=item.family_member_id,
            date=calculated_date
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    @staticmethod
    def update_plan_item(db: Session, item_id: int, item_update: schemas.PlanItemUpdate):
        db_item = db.query(models.WeeklyPlanEntry).filter(models.WeeklyPlanEntry.id == item_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        if item_update.portions is not None:
            db_item.portions = item_update.portions
        if item_update.family_member_id is not None:
            db_item.family_member_id = item_update.family_member_id
        if item_update.date is not None:
            db_item.date = item_update.date
        if item_update.meal_type is not None:
            db_item.meal_type = item_update.meal_type
        if item_update.day_of_week is not None:
            db_item.day_of_week = item_update.day_of_week
            
        db.commit()
        db.refresh(db_item)
        return db_item

    @staticmethod
    def remove_from_plan(db: Session, item_id: int):
        db_item = db.query(models.WeeklyPlanEntry).filter(models.WeeklyPlanEntry.id == item_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        db.delete(db_item)
        db.commit()
        return {"ok": True}

    @staticmethod
    def clear_plan(db: Session, start_date: datetime.date = None, end_date: datetime.date = None):
        q = db.query(models.WeeklyPlanEntry)
        if start_date:
            q = q.filter(models.WeeklyPlanEntry.date >= start_date)
        if end_date:
            q = q.filter(models.WeeklyPlanEntry.date <= end_date)
            
        q.delete(synchronize_session=False)
        db.commit()
        return {"ok": True}

    @staticmethod
    def batch_update(db: Session, items: list[schemas.PlanItemCreate]):
        if not items:
            return []

        dates = [item.date for item in items if item.date]
        if not dates:
             raise HTTPException(status_code=400, detail="Dates required for batch update")

        min_date = min(dates)
        max_date = max(dates)

        # Clear range
        PlanService.clear_plan(db, min_date, max_date)
        
        # Insert
        new_items = []
        for item in items:
            db_item = models.WeeklyPlanEntry(
                day_of_week=item.day_of_week,
                meal_type=item.meal_type,
                recipe_id=item.recipe_id,
                portions=item.portions,
                family_member_id=item.family_member_id,
                date=item.date
            )
            db.add(db_item)
            new_items.append(db_item)

        db.commit()
        for item in new_items: db.refresh(item)
        return new_items

    @staticmethod
    def autofill_week(db: Session):
        # 0. Get users
        family_members = db.query(models.FamilyMember).all()
        if not family_members:
            family_members = [None]

        # 1. Determine dates for next week
        today = datetime.date.today()
        current_weekday = today.weekday() # 0 = Mon
        days_until_next_monday = 7 - current_weekday
        next_monday = today + datetime.timedelta(days=days_until_next_monday)
        
        days_map = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
        target_meals = ['lunch', 'dinner']
        
        # 2. Fetch candidates (Main/Soup)
        candidates = db.query(models.Recipe).options(
            joinedload(models.Recipe.ingredients).joinedload(models.RecipeIngredient.product)
        ).filter(
            models.Recipe.category.in_(['soup', 'main'])
        ).all()
        
        if not candidates:
            raise HTTPException(status_code=400, detail="No recipes found (need soup or main)")

        count = 0
        current_recipe = None
        portions_left = 0
        last_recipe_id = None

        # Track daily calories: {(date_str, member_id): current_calories}
        daily_calories = {}
        
        # Generate chronological slots
        slots = []
        for i in range(7):
            target_date = next_monday + datetime.timedelta(days=i)
            target_day_name = days_map[i]
            for meal in target_meals:
                slots.append({
                    "date": target_date,
                    "day": target_day_name,
                    "meal": meal
                })

        # Iterate through slots
        for slot in slots:
            # 3. Pot Check
            if portions_left <= 0:
                # Filter repeats
                valid_candidates = [r for r in candidates if r.id != last_recipe_id]
                if not valid_candidates:
                    valid_candidates = candidates
                
                current_recipe = random.choice(valid_candidates)
                last_recipe_id = current_recipe.id
                
                portions_left = current_recipe.portions
                if portions_left < 1: portions_left = 1

            # For each member
            for member in family_members:
                member_id = member.id if member else None
                
                # Check occupancy
                q = db.query(models.WeeklyPlanEntry).filter(
                    models.WeeklyPlanEntry.date == slot["date"],
                    models.WeeklyPlanEntry.meal_type == slot["meal"]
                )
                if member_id:
                    q = q.filter(models.WeeklyPlanEntry.family_member_id == member_id)
                else:
                    q = q.filter(models.WeeklyPlanEntry.family_member_id == None)
                    
                exists = q.first()
                if exists:
                    continue
                
                # 4. Fill Logic
                if portions_left > 0:
                    recipe_cals = current_recipe.calories_per_portion
                    
                    # Calorie Check
                    limit = member.max_calories if member else 2000
                    date_str = slot["date"].isoformat()
                    current_daily_cals = daily_calories.get((date_str, member_id), 0)
                    
                    if current_daily_cals >= (limit - 200):
                         continue

                    new_item = models.WeeklyPlanEntry(
                        day_of_week=slot["day"],
                        meal_type=slot["meal"],
                        recipe_id=current_recipe.id,
                        portions=1,
                        family_member_id=member_id,
                        date=slot["date"]
                    )
                    db.add(new_item)
                    count += 1
                    
                    # Update stats
                    daily_calories[(date_str, member_id)] = current_daily_cals + recipe_cals
                    portions_left -= 1
                else:
                    pass

        db.commit()
        msg = f"Planned {count} items for next week for {len(family_members)} people."
        return {"message": msg}

    @staticmethod
    def autofill_one(db: Session, req: schemas.AutoFillRequest = None):
        now = datetime.datetime.now()
        hour = now.hour
        
        target_meal = 'snack'
        if 0 <= hour < 11: target_meal = 'breakfast'
        elif 11 <= hour < 14: target_meal = 'lunch'
        elif 14 <= hour < 18: target_meal = 'afternoon_snack'
        else: target_meal = 'dinner' # 18-24

        allowed_categories = ['snack']
        
        candidates = db.query(models.Recipe).filter(
            models.Recipe.category.in_(allowed_categories)
        ).all()
        
        if not candidates:
            raise HTTPException(status_code=400, detail="No snacks found")

        days_map = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
        target_day = days_map[now.weekday()]
        
        target_recipe = random.choice(candidates)
        
        new_item = models.WeeklyPlanEntry(
            day_of_week=target_day,
            meal_type=target_meal,
            recipe_id=target_recipe.id,
            portions=1,
            family_member_id=req.family_member_id if req else None,
            date=datetime.date.today()
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        
        warning_msg = None
        if req and req.family_member_id:
            member = db.query(models.FamilyMember).filter(models.FamilyMember.id == req.family_member_id).first()
            if member:
                today_items = db.query(models.WeeklyPlanEntry).options(joinedload(models.WeeklyPlanEntry.recipe)).filter(
                    models.WeeklyPlanEntry.date == datetime.date.today(),
                    models.WeeklyPlanEntry.family_member_id == req.family_member_id
                ).all()
                
                total_cals = sum(item.recipe.calories_per_portion * item.portions for item in today_items if item.recipe)
                
                if total_cals > member.max_calories:
                    warning_msg = f"Внимание! Вы превысили норму калорий ({member.max_calories}) на сегодня! (Сейчас: {round(total_cals)})"

        return {
            "message": f"Added {target_recipe.title}", 
            "day": target_day, 
            "meal": target_meal, 
            "recipe": target_recipe.title,
            "warning": warning_msg
        }

    @staticmethod
    def export_plan(db: Session):
        today = datetime.date.today()
        current_weekday = today.weekday()
        start_of_week = today - datetime.timedelta(days=current_weekday)
        end_of_week = start_of_week + datetime.timedelta(days=6)

        plan = PlanService.get_plan(db, start_of_week, end_of_week)

        data = []
        for item in plan:
            data.append({
                "day": item.day_of_week,
                "meal": item.meal_type,
                "recipe_id": item.recipe_id,
                "portions": item.portions,
                "family_member_id": item.family_member_id,
                "date": item.date.isoformat() if item.date else None 
            })
        try:
            with open(EXPORT_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return {"message": f"Saved {len(data)} items from current week"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    def import_plan(db: Session):
        if not os.path.exists(EXPORT_PATH):
            raise HTTPException(status_code=404, detail="File not found")
        try:
            with open(EXPORT_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
             raise HTTPException(status_code=500, detail=str(e))

        today = datetime.date.today()
        current_weekday = today.weekday()
        start_of_week = today - datetime.timedelta(days=current_weekday)
        end_of_week = start_of_week + datetime.timedelta(days=6)

        PlanService.clear_plan(db, start_of_week, end_of_week)
        
        count = 0
        for item in data:
            day_name = item.get("day")
            target_date = get_date_for_day_of_week(day_name)
            
            new_entry = models.WeeklyPlanEntry(
                day_of_week=day_name,
                meal_type=item.get("meal"),
                recipe_id=item.get("recipe_id"),
                portions=item.get("portions", 1),
                family_member_id=item.get("family_member_id"),
                date=target_date
            )
            db.add(new_entry)
            count += 1
        
        db.commit()
        return {"message": f"Imported {count} items into current week"}
