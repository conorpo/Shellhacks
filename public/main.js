document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('botConfigForm');
    const objectivesList = document.getElementById('objectives-list');
    const phoneList = document.getElementById('phone-list');
    const addObjectiveButton = document.getElementById('add-objective');
    const addPhoneButton = document.getElementById('add-phone');
    const csvUpload = document.getElementById('csv-upload');
    const fileName = document.getElementById('file-name');
    const csvPreview = document.getElementById('csv-preview');

    // Add new AI objective input
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

    // Remove AI objective input
    objectivesList.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove')) {
            const item = e.target.closest('.objective-item');
            item.style.animation = 'fadeIn 0.5s ease reverse';
            setTimeout(() => item.remove(), 500);
        }
    });

    // Add new phone number input
    addPhoneButton.addEventListener('click', function() {
        const newPhone = document.createElement('li');
        newPhone.className = 'objective-item';
        const phoneCount = phoneList.children.length + 1;
        newPhone.innerHTML = `
            <input type="text" name="phone-numbers[]" required placeholder="Phone Number ${phoneCount}">
            <button type="button" class="btn-remove">Remove</button>
        `;
        phoneList.appendChild(newPhone);
    });

    // Remove phone number input
    phoneList.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove')) {
            const item = e.target.closest('.objective-item');
            item.style.animation = 'fadeIn 0.5s ease reverse';
            setTimeout(() => item.remove(), 500);
        }
    });

    // Preview uploaded CSV file
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

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const data = {
            companyName: formData.get('company-name'),
            description: formData.get('description'),
            objectives: formData.getAll('objectives[]'),
            phone_numbers: formData.getAll('phone-numbers[]'),
            opener: formData.get('opener'),
            csvFile: csvUpload.files[0]
        };

        console.log('AI Bot Configuration:', data);

        try {
            const response = await fetch('./api/updateCompany', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            e.preventDefault();
    
            // Retrieve the business name from the form input
            const companyName = document.getElementById('company-name').value;
            console.log("Company Name submitted:", companyName); // Debugging
    
            // Store the business name in sessionStorage
            sessionStorage.setItem('businessName', companyName);
    
            // Show the loading screen
            document.getElementById('loading-screen').style.display = 'flex';
    
            // Redirect to the results page after a short delay
            setTimeout(async function() {
                const {phone_numbers, companyName} = data;
            
                const response = await fetch('./api/initiateCalls', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({phone_numbers, companyName})
                });
                
                setTimeout(function() {
                    window.location.href = "./results.html";
                }, 120 * 1000);
            }, 5000);             // Adjusted to 2 seconds

            if (response.ok) {
                fileName.textContent = '';
            } else {
                throw new Error('Failed to configure AI');
            }
        } catch (error) {
            console.error('Error configuring AI:', error);
            alert('Failed to configure AI. Please try again.');
        }
    });
});
