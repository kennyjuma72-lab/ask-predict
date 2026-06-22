"""
Tiny Q&A app using Streamlit + Lovable AI Gateway.

Run:
    pip install streamlit requests
    export LOVABLE_API_KEY=...   # already set in Lovable sandbox
    streamlit run app.py
"""

import os
import requests
import streamlit as st

API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions"
MODEL = "google/gemini-3-flash-preview"


def predict_answer(question: str) -> str:
    api_key = os.environ.get("LOVABLE_API_KEY")
    if not api_key:
        return "Error: LOVABLE_API_KEY is not set."

    resp = requests.post(
        API_URL,
        headers={
            "Content-Type": "application/json",
            "Lovable-API-Key": api_key,
        },
        json={
            "model": MODEL,
            "messages": [
                {"role": "system", "content": "You are a concise, helpful assistant. Answer in 1-3 sentences."},
                {"role": "user", "content": question},
            ],
        },
        timeout=60,
    )

    if resp.status_code == 429:
        return "Rate limit hit. Please try again in a moment."
    if resp.status_code == 402:
        return "AI credits exhausted. Add credits to keep going."
    if not resp.ok:
        return f"Error {resp.status_code}: {resp.text}"

    return resp.json()["choices"][0]["message"]["content"].strip()


def main() -> None:
    st.set_page_config(page_title="Ask & Predict", page_icon="💡")
    st.title("💡 Ask a Question")
    st.caption("Type a question and get a predicted answer.")

    question = st.text_area("Your question", placeholder="e.g. What causes the northern lights?")

    if st.button("Predict answer", type="primary", disabled=not question.strip()):
        with st.spinner("Thinking..."):
            answer = predict_answer(question.strip())
        st.subheader("Answer")
        st.write(answer)


if __name__ == "__main__":
    main()
