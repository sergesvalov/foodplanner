from sqlalchemy.orm import Session
import models

def calculate_shopping_list(db: Session):
    """
    Business logic for aggregating the shopping list from the weekly plan.
    """
    plan_items = db.query(models.WeeklyPlanEntry).all()
    shopping_dict = {}

    for plan_item in plan_items:
        if not plan_item.recipe: continue
        
        # --- SCALING ---
        base_portions = plan_item.recipe.portions if plan_item.recipe.portions > 0 else 1
        target_portions = plan_item.portions if plan_item.portions > 0 else 1
        
        # Scaling Ratio
        ratio = target_portions / base_portions

        for ingredient in plan_item.recipe.ingredients:
            if not ingredient.product: continue
            
            p_id = ingredient.product_id
            if p_id not in shopping_dict:
                shopping_dict[p_id] = {"product": ingredient.product, "quantity": 0.0}
            
            # Multiply by ratio
            shopping_dict[p_id]["quantity"] += (ingredient.quantity * ratio)

    result = []
    for p_id, data in shopping_dict.items():
        product = data["product"]
        total_qty = data["quantity"]
        
        pack_amount = product.amount if product.amount > 0 else 1.0
        price_per_unit = product.price / pack_amount
        estimated_cost = total_qty * price_per_unit

        result.append({
            "id": product.id,
            "name": product.name,
            "total_quantity": round(total_qty, 3),
            "unit": product.unit,
            "estimated_cost": round(estimated_cost, 2),
            "packs_needed": round(total_qty / pack_amount, 1)
        })
    
    result.sort(key=lambda x: x["name"])
    return result
