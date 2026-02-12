import requests
import os
import json
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException
import models
import schemas

logger = logging.getLogger(__name__)

EXPORT_PATH = "/app/data/products.json"
# Порт 8000 - Backend API (FastAPI), порт 8010 - Frontend
EXTERNAL_API_URL = "http://192.168.10.222:8000/products/"

class ProductService:
    @staticmethod
    def get_products(db: Session, name: str = None):
        query = db.query(models.Product)
        if name:
            # Case-insensitive partial match
            query = query.filter(models.Product.name.ilike(f"%{name}%"))
        return query.all()

    @staticmethod
    def get_product_by_id(db: Session, product_id: int):
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    @staticmethod
    def create_product(db: Session, product: schemas.ProductCreate):
        db_product = models.Product(**product.dict())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product

    @staticmethod
    def update_product(db: Session, product_id: int, product: schemas.ProductCreate):
        db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if db_product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        
        db_product.name = product.name
        db_product.price = product.price
        db_product.unit = product.unit
        db_product.amount = product.amount
        db_product.calories = product.calories
        db_product.proteins = product.proteins
        db_product.fats = product.fats
        db_product.carbs = product.carbs
        db_product.weight_per_piece = product.weight_per_piece
        
        db.commit()
        db.refresh(db_product)
        return db_product

    @staticmethod
    def delete_product(db: Session, product_id: int):
        item = db.query(models.Product).filter(models.Product.id == product_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Product not found")
        db.delete(item)
        db.commit()
        return {"ok": True}

    @staticmethod
    def export_products(db: Session):
        products = db.query(models.Product).all()
        data = [{
            "name": p.name,
            "price": p.price,
            "unit": p.unit,
            "amount": p.amount,
            "calories": p.calories,
            "proteins": p.proteins,
            "fats": p.fats,
            "carbs": p.carbs,
            "weight_per_piece": p.weight_per_piece
        } for p in products]
        
        try:
            # Ensure the directory exists
            export_dir = os.path.dirname(EXPORT_PATH)
            os.makedirs(export_dir, exist_ok=True)
            
            with open(EXPORT_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return {"message": f"Успешно сохранено {len(data)} товаров в {EXPORT_PATH}"}
        except Exception as e:
            logger.error(f"Ошибка экспорта продуктов: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Ошибка записи: {str(e)}")

    @staticmethod
    def import_products(db: Session):
        logger.info(f"Начало импорта продуктов из {EXTERNAL_API_URL}")
        try:
            response = requests.get(EXTERNAL_API_URL, timeout=10)
            logger.info(f"Получен ответ с кодом {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Ошибка API: код {response.status_code}, ответ: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"Ошибка внешнего API: {response.text}")
            
            data = response.json()
            logger.info(f"Получено {len(data)} продуктов из внешнего API")
            
        except requests.RequestException as e:
            logger.error(f"Ошибка соединения с {EXTERNAL_API_URL}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Ошибка соединения с внешним API: {str(e)}")
        except Exception as e:
            logger.error(f"Ошибка обработки данных: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Ошибка обработки данных: {str(e)}")

        created_count, updated_count, skipped_count = 0, 0, 0
        
        for item in data:
            try:
                db_product = db.query(models.Product).filter(models.Product.name == item["name"]).first()
                params = {
                    "price": float(item.get("price", 0)),
                    "amount": float(item.get("amount", 1.0)),
                    "unit": item.get("unit", "шт"),
                    "calories": float(item.get("calories", 0)),
                    "proteins": item.get("proteins"),
                    "fats": item.get("fats"),
                    "carbs": item.get("carbs"),
                    "weight_per_piece": item.get("weight_per_piece")
                }

                if not db_product:
                    new_product = models.Product(name=item["name"], **params)
                    db.add(new_product)
                    created_count += 1
                    logger.debug(f"Создан новый продукт: {item['name']}")
                else:
                    if (db_product.price != params["price"] or 
                        db_product.amount != params["amount"] or
                        db_product.unit != params["unit"] or
                        db_product.calories != params["calories"]):
                        
                        db_product.price = params["price"]
                        db_product.amount = params["amount"]
                        db_product.unit = params["unit"]
                        db_product.calories = params["calories"]
                        db_product.proteins = params["proteins"]
                        db_product.fats = params["fats"]
                        db_product.carbs = params["carbs"]
                        db_product.weight_per_piece = params["weight_per_piece"]
                        updated_count += 1
                        logger.debug(f"Обновлен продукт: {item['name']}")
                    else:
                        skipped_count += 1
            
            except KeyError as e:
                logger.warning(f"Пропущен продукт из-за отсутствия поля {e}: {item}")
                skipped_count += 1
            except Exception as e:
                logger.error(f"Ошибка при обработке продукта {item.get('name', 'unknown')}: {str(e)}")
                skipped_count += 1
    
        db.commit()
        logger.info(f"Импорт завершен: создано={created_count}, обновлено={updated_count}, пропущено={skipped_count}")
        return {
            "message": f"Создано: {created_count}, Обновлено: {updated_count}, Пропущено: {skipped_count}",
            "created": created_count,
            "updated": updated_count,
            "skipped": skipped_count
        }
