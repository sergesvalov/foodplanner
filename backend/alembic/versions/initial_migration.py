"""add category column

Revision ID: 001
Revises: 
Create Date: 2023-10-27 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Получаем текущее состояние базы
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # 1. Если таблицы recipes нет, создаем её (случай чистой базы)
    if 'recipes' not in tables:
        op.create_table('recipes',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(), nullable=True),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('portions', sa.Integer(), default=1),
            sa.Column('category', sa.String(), default='other'), # Наша новая колонка
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_recipes_id'), 'recipes', ['id'], unique=False)
        op.create_index(op.f('ix_recipes_title'), 'recipes', ['title'], unique=False)
    
    # 2. Если таблица есть, проверяем колонку category
    else:
        columns = [c['name'] for c in inspector.get_columns('recipes')]
        if 'category' not in columns:
            op.add_column('recipes', sa.Column('category', sa.String(), server_default='other', nullable=True))

    # 3. Аналогично проверяем/создаем остальные таблицы, если их нет
    # (для упрощения здесь код только для recipes, так как мы меняли её. 
    # В реальном проекте alembic autogenerate делает это сам)
    
    # Убедимся, что создана таблица family_members (так как она новая)
    if 'family_members' not in tables:
        op.create_table('family_members',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('color', sa.String(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_family_members_id'), 'family_members', ['id'], unique=False)
        op.create_index(op.f('ix_family_members_name'), 'family_members', ['name'], unique=False)

    # Проверяем колонку family_member_id в weekly_plan
    if 'weekly_plan' in tables:
        columns = [c['name'] for c in inspector.get_columns('weekly_plan')]
        if 'family_member_id' not in columns:
             op.add_column('weekly_plan', sa.Column('family_member_id', sa.Integer(), nullable=True))
             # SQLite имеет ограничения на ALTER TABLE с Foreign Key, но для простых случаев прокатит
             # Либо можно оставить просто колонку без констрейнта на уровне БД для SQLite

def downgrade() -> None:
    # Откат изменений
    op.drop_column('recipes', 'category')
    op.drop_column('weekly_plan', 'family_member_id')
    # Таблицы удалять не будем, чтобы не потерять данные при случайном откате