import datetime

def get_current_week_boundaries():
    """Returns (monday, sunday) of current week."""
    today = datetime.date.today()
    current_weekday = today.weekday() # 0 = Mon
    start_of_week = today - datetime.timedelta(days=current_weekday) # Monday
    end_of_week = start_of_week + datetime.timedelta(days=6) # Sunday
    return start_of_week, end_of_week

def get_next_week_monday():
    """Returns next week's Monday."""
    today = datetime.date.today()
    current_weekday = today.weekday() # 0 = Mon
    days_until_next_monday = 7 - current_weekday
    return today + datetime.timedelta(days=days_until_next_monday)

def get_date_for_day_of_week(day_name: str, reference_date: datetime.date = None) -> datetime.date:
    """Calculates date for a given day name relative to reference_date (defaults to today's week)."""
    days_map = {
        'Понедельник': 0, 'Вторник': 1, 'Среда': 2, 'Четверг': 3,
        'Пятница': 4, 'Суббота': 5, 'Воскресенье': 6
    }
    target_weekday = days_map.get(day_name)
    if target_weekday is None:
        return reference_date or datetime.date.today()
    
    if reference_date is None:
        reference_date = datetime.date.today()
    
    current_weekday = reference_date.weekday()
    monday_of_week = reference_date - datetime.timedelta(days=current_weekday)
    
    return monday_of_week + datetime.timedelta(days=target_weekday)
