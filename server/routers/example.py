from fastapi import APIRouter, HTTPException

from supabase_client import supabase_admin

router = APIRouter()


@router.get("/")
def get_example_data() -> dict:
    """
    Example endpoint that queries Supabase server-side.
    Replace 'your_table' with a real table name.
    """
    response = supabase_admin.table("your_table").select("*").limit(10).execute()
    return {"data": response.data}
