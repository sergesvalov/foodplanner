import datetime
import random
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
import models
import schemas

def autofill_week_logic(db: Session):
    """
    Business logic to populate the weekly plan for the UPCOMING week.
    Considers leftover portions and calorie limits.
    """
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

def autofill_one_logic(req: schemas.AutoFillRequest, db: Session):
    """
    Logic to fill a single slot based on current time.
    """
    now = datetime.datetime.now()
    hour = now.hour
    
    target_meal = 'snack'
    if 0 <= hour < 11: target_meal = 'breakfast'
    elif 11 <= hour < 14: target_meal = 'lunch'
    elif 14 <= hour < 18: target_meal = 'afternoon_snack'
    else: target_meal = 'dinner' # 18-24

    allowed_categories = ['snack']
    if target_meal == 'breakfast': allowed_categories = ['breakfast', 'snack']
    elif target_meal == 'lunch': allowed_categories = ['soup', 'main', 'salad']
    elif target_meal == 'dinner': allowed_categories = ['main', 'salad', 'snack']
    
    candidates = db.query(models.Recipe).filter(
        models.Recipe.category.in_(allowed_categories)
    ).all()
    
    if not candidates:
        raise HTTPException(status_code=400, detail="No recipes found for this time")

    days_map = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    target_day = days_map[now.weekday()]
    
    # ... check occupation - REMOVED to allow multiple items (snacks/leftovers)
    # q = db.query(models.WeeklyPlanEntry).filter(...)
    # if q.first(): raise ...

    target_recipe = None
    
    # "Leftover" Logic for Lunch/Dinner: Try to find the last cooked meal
    if target_meal in ['lunch', 'dinner']:
        # Find last meal (excluding current slot context roughly)
        # We look for ANY recent meal of type lunch/dinner that is NOT today's current slot (which is empty anyway)
        last_meal = db.query(models.WeeklyPlanEntry).join(models.Recipe).filter(
            models.WeeklyPlanEntry.meal_type.in_(['lunch', 'dinner']),
            models.Recipe.category.in_(['soup', 'main']),
            models.WeeklyPlanEntry.date <= datetime.date.today()
        ).order_by(
            models.WeeklyPlanEntry.date.desc(), 
            models.WeeklyPlanEntry.id.desc()
        ).first()

        if last_meal:
            target_recipe = last_meal.recipe
            # Optional: Check if we just ate it? 
            # If I just ate Pizza for Lunch, do I want Pizza for Dinner? YES, that's what "dozhrat" (finish) means.

    if not target_recipe:
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
    
    return {
        "message": f"Added {target_recipe.title}", 
        "day": target_day, 
        "meal": target_meal, 
        "recipe": target_recipe.title
    }
