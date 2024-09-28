document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('botConfigForm');
    const objectivesList = document.getElementById('objectives-list');
    const addObjectiveButton = document.getElementById('add-objective');

    addObjectiveButton.addEventListener('click', function() {
        const newObjective = document.createElement('li');
        newObjective.className = 'objective-item';
        const objectiveCount = objectivesList.children.length + 1;
        newObjective.innerHTML = `
            <input type="text" name="objectives[]" required placeholder="AI Objective ${objectiveCount}">
            <button type="button" class="btn-remove">Remove</button>
        `;
        objectivesList.appendChild(newObjective);
    });

    objectivesList.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove')) {
            const item = e.target.closest('.objective-item');
            item.style.animation = 'fadeIn 0.5s ease reverse';
            setTimeout(() => item.remove(), 500);
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const data = {
            companyName: formData.get('company-name'),
            services: formData.get('services'),
            objectives: formData.getAll('objectives[]')
        };
        console.log('AI Bot Configuration:', data);
        alert('AI Configuration activated successfully!');
        // Here you would typically send the data to your backend or AI model
    });
});