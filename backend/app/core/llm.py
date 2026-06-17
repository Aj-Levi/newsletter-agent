from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from app.core.config import settings

llm = ChatGroq(
    model=settings.AI_MODEL,
    api_key=settings.AI_API_KEY,
    temperature=0.7
)
