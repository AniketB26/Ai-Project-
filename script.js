document.addEventListener('DOMContentLoaded', () => {
    // Store fetched experiments globally
    let fetchedExperiments = [];

    // Trigger initial animations for static elements
    const staticElements = document.querySelectorAll('.animate-fade-in, .animate-slide-up');
    staticElements.forEach(el => {
        el.style.animationFillMode = 'forwards';
    });

    // Scroll-triggered animations for image cards
    const imageCards = document.querySelectorAll('.image-card');
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before the element is fully in view
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    imageCards.forEach(card => {
        observer.observe(card);
    });

    // Event listeners for experiments.html
    const suggestBtn = document.getElementById('suggestBtn');
    const clearBtn = document.getElementById('clearBtn');

    if (suggestBtn) {
        suggestBtn.addEventListener('click', async () => {
            const materialsInput = document.getElementById('materials').value.trim();
            const category = document.getElementById('category').value;
            const resultsDiv = document.getElementById('results');
            const experimentList = document.getElementById('experimentList');
            const loadingDiv = document.getElementById('loading');

            if (!materialsInput) {
                alert('Please enter some materials!');
                return;
            }

            loadingDiv.classList.remove('hidden');
            resultsDiv.classList.add('hidden');
            experimentList.innerHTML = '';

            try {
                const materials = materialsInput.split(',').map(m => m.trim());
                fetchedExperiments = await window.fetchExperiments(materials, category);

                if (fetchedExperiments.length === 0) {
                    experimentList.innerHTML = '<p class="text-gray-300 animate-slide-up">No experiments found.</p>';
                } else {
                    fetchedExperiments.forEach((exp, index) => {
                        const expDiv = document.createElement('div');
                        expDiv.className = 'p-4 bg-gray-800 bg-opacity-50 rounded-lg shadow-sm hover:shadow-md transition animate-slide-up';
                        expDiv.style.animationDelay = `${index * 0.2}s`;
                        expDiv.style.animationFillMode = 'forwards';
                        expDiv.innerHTML = `
                            <h3 class="text-lg font-semibold text-indigo-400">${exp.name}</h3>
                            <p class="text-gray-300">${exp.description}</p>
                            <p class="text-sm text-gray-400">Materials: ${exp.materials.join(', ')}</p>
                            <p class="text-sm text-gray-400">Category: ${exp.category}</p>
                            <button class="mt-2 text-indigo-400 hover:underline" onclick="window.explainSteps('${exp.name}')">Explain Steps</button>
                        `;
                        experimentList.appendChild(expDiv);
                    });
                }

                resultsDiv.classList.remove('hidden');
            } catch (error) {
                console.error('Error:', error);
                experimentList.innerHTML = '<p class="text-red-400 animate-slide-up">Something went wrong!</p>';
                resultsDiv.classList.remove('hidden');
            } finally {
                loadingDiv.classList.add('hidden');
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            document.getElementById('materials').value = '';
            document.getElementById('category').value = 'all';
            document.getElementById('results').classList.add('hidden');
            document.getElementById('experimentList').innerHTML = '';
            fetchedExperiments = []; // Clear stored experiments
        });
    }

    // Global function to explain steps using AI-provided steps
    window.explainSteps = function(experimentName) {
        if (confirm(`Show steps for "${experimentName}"?`)) {
            const experimentList = document.getElementById('experimentList');
            const stepsContainer = document.createElement('div');
            stepsContainer.className = 'mt-4 p-4 bg-gray-700 bg-opacity-50 rounded-lg shadow-sm animate-slide-up';

            // Find the experiment in fetchedExperiments
            const experiment = fetchedExperiments.find(exp => exp.name.toLowerCase() === experimentName.toLowerCase());
            const steps = experiment && experiment.steps ? experiment.steps : ['Steps not available for this experiment.'];

            // Create ordered list of steps
            const stepsHtml = steps.map(step => `<li class="text-gray-300">${step}</li>`).join('');
            stepsContainer.innerHTML = `
                <h4 class="text-md font-semibold text-indigo-400">Steps for "${experimentName}"</h4>
                <ol class="list-decimal list-inside mt-2 text-gray-300">${stepsHtml}</ol>
            `;

            experimentList.appendChild(stepsContainer);
            stepsContainer.scrollIntoView({ behavior: 'smooth' });
        }
    };
});