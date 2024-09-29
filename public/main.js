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

  document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('botConfigForm');
    const objectivesList = document.getElementById('objectives-list');
    const addObjectiveButton = document.getElementById('add-objective');
    const csvUpload = document.getElementById('csv-upload');
    const fileName = document.getElementById('file-name');
    const csvPreview = document.getElementById('csv-preview');

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

    csvUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            fileName.textContent = file.name;
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                const lines = content.split('\n');
                const previewLines = lines.slice(0, 5).join('\n');
                csvPreview.innerHTML = `<pre>${previewLines}</pre>`;
                if (lines.length > 5) {
                    csvPreview.innerHTML += '<p>...</p>';
                }
            };
            reader.readAsText(file);
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        console.log('AI Bot Configuration:', data);
        alert('AI Configuration activated successfully!');
        // Here you would typically send the data to your backend or AI model
    });
});

  form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData(form);
        const data = {
            companyName: formData.get('company-name'),
            services: formData.get('services'),
            objectives: formData.getAll('objectives[]'),
            csvFile: csvUpload.files[0]
        };
      console.log('AI Bot Configuration:', data);

      try {
          const response = await fetch('./api/configure-ai', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(data)
          });

          if (response.ok) {
              alert('AI Configuration activated successfully!');
              // Optionally, you can reset the form here
              form.reset();
          } else {
              throw new Error('Failed to configure AI');
          }
      } catch (error) {
          console.error('Error configuring AI:', error);
          alert('Failed to configure AI. Please try again.');
      }
  });
});