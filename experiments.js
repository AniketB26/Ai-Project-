const HF_API_TOKEN = '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'; // Hugging Face token
const API_ENDPOINT = 'https://api-inference.huggingface.co/models/google/gemma-2-9b-it'; // Model used

async function fetchExperiments(materials, category, retries = 3, delay = 1000) {
    const prompt = `
        You are a science experiment assistant. Suggest about 5 science experiments that can be performed using the following materials: ${materials.join(', ')}.
        ${category !== 'all' ? `Focus on experiments in the ${category} category.` : 'Experiments can be from any category (e.g., chemistry, physics, biology).'}
        For each experiment, provide:
        - A name
        - A brief description
        - The list of materials used (as an array)
        - The category of the experiment
        - A list of steps to perform the experiment (as an array of strings)
        If no experiments can be suggested with the given materials, return an empty experiments array: {"experiments": []}.
        Return the response in JSON format, enclosed in \`\`\`json and \`\`\` markers, with the following structure:
        \`\`\`json
        {
            "experiments": [
                {
                    "name": "Experiment Name",
                    "description": "Description here",
                    "materials": ["material1", "material2"],
                    "category": "category",
                    "steps": ["Step 1: Do this", "Step 2: Do that"]
                }
            ]
        }
        \`\`\`
        Ensure the JSON is valid and properly formatted. Do not include any additional text outside the JSON structure.
    `;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${HF_API_TOKEN}`
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 1500, // Increased for more detailed responses
                        return_full_text: false
                    }
                })
            });

            if (!response.ok) {
                if (response.status === 429 && attempt < retries) {
                    const waitTime = delay * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            const generatedText = data[0]?.generated_text || '';
            console.log('Raw API Response:', generatedText); // Debug log

            // Try to extract JSON from the response
            try {
                const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || generatedText.match(/{[\s\S]*}/);
                if (jsonMatch) {
                    const jsonString = jsonMatch[1] || jsonMatch[0];
                    const content = JSON.parse(jsonString);
                    const experiments = content.experiments || [];
                    // Validate that each experiment has a steps array
                    return experiments.map(exp => ({
                        ...exp,
                        steps: Array.isArray(exp.steps) ? exp.steps : ['Steps not provided by AI.']
                    }));
                } else {
                    throw new Error('No valid JSON found in the response');
                }
            } catch (parseError) {
                console.error('Parsing Error:', parseError);
                return [{ name: 'Error', description: 'Failed to parse experiment suggestions.', materials: [], category: 'N/A', steps: ['Please try again with different materials.'] }];
            }
        } catch (error) {
            if (attempt === retries) {
                console.error('Max retries reached:', error);
                return [{ name: 'Error', description: 'Unable to fetch experiments due to an API error.', materials: [], category: 'N/A', steps: ['Please try again later.'] }];
            }
        }
    }
    return [{ name: 'Error', description: 'Max retries reached. Could not fetch experiments.', materials: [], category: 'N/A', steps: ['Please check your internet connection and try again.'] }];
}

window.fetchExperiments = fetchExperiments;