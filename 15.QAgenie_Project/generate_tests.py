import json
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain

def generate_test_cases():
    """Generates test cases from the transcript using a local LLM."""
    print("Connecting to local LLM (llama3:8b)...")
    # Initialize the connection to the Ollama model
    llm = Ollama(model="llama3:8b", temperature=0.2)

    # The "personality" and instructions for our QAgenie
    prompt_template = """
    You are QAgenie — a calm, thorough AI QA assistant. Your mission is to ensure
    flawless user experiences. Based on the provided video transcript segment about
    a recruiting application, generate comprehensive frontend test cases.

    Focus on:
    1.  **Core User Flows**: The main steps a user would take (e.g., signup, login, search).
    2.  **Edge Cases**: Invalid inputs (e.g., bad email format), empty fields, boundary values.
    3.  **Accessibility**: Mention checks for screen readers or keyboard navigation.

    **Output Format**: Your entire response MUST be a single, valid JSON array of objects.
    Each object should have "test_case_id", "description", and an array of "steps".
    Do NOT include any text or explanations outside of the JSON array.

    Example:
    [
        {
            "test_case_id": "TC-LOGIN-01",
            "description": "Verify successful user login with valid credentials.",
            "steps": [
                "Navigate to the login page.",
                "Enter a valid username.",
                "Enter a valid password.",
                "Click the 'Login' button.",
                "Assert that the user is redirected to the dashboard."
            ]
        }
    ]

    **Video Transcript Segment**:
    "{text}"

    **JSON Output**:
    """

    prompt = PromptTemplate(template=prompt_template, input_variables=["text"])
    llm_chain = LLMChain(llm=llm, prompt=prompt)

    print("Reading video transcript...")
    with open("video_transcript.txt", "r", encoding="utf-8") as f:
        transcript = f.read()

    print("Generating test cases... This can take a moment.")
    # We feed the whole transcript. For very long videos, you might chunk it.
    response = llm_chain.invoke({"text": transcript})

    # The response dictionary contains the 'text' key with the model's output
    generated_text = response['text']

    # Clean up the output to ensure it's valid JSON
    try:
        # Find the start and end of the JSON array
        json_start = generated_text.find('[')
        json_end = generated_text.rfind(']') + 1
        json_str = generated_text[json_start:json_end]

        # Parse the cleaned string into a Python list
        test_cases = json.loads(json_str)

        # Save the valid JSON to a file
        output_file = "playwright_test_plan.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(test_cases, f, indent=4)

        print(f"Successfully generated and saved {len(test_cases)} test cases to '{output_file}'")

    except (json.JSONDecodeError, IndexError) as e:
        print(f"Error: Could not parse LLM output as JSON. Error: {e}")
        print("Raw output from LLM:")
        print(generated_text)

if __name__ == "__main__":
    generate_test_cases()