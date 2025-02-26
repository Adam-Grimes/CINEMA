document.addEventListener("DOMContentLoaded", () => {
    const collections = document.querySelectorAll("#collections li");
    const collectionTitle = document.getElementById("collection-title");
    const itemsTableBody = document.querySelector("#items-table tbody");
    const modal = document.getElementById("modal");
    const closeButton = document.querySelector(".close-button");
    const createButton = document.getElementById("create-button");
    const itemForm = document.getElementById("item-form");
    let activeCollection = "bookings";
    let currentItem = null;
    let items = [];
    let activeCollectionButton = null; // Track active sidebar button

    // Collection configuration
    const collectionConfig = {
        bookings: { idField: 'BookingID', fields: ['ScreeningID', 'NoOfSeats', 'Cost', 'EmailAddress'] },
        films: { idField: 'FilmID', fields: ['Name', 'Category', 'Genre', 'Duration'] },
        screenings: { idField: 'ScreeningID', fields: ['FilmID', 'TheatreID', 'Date', 'StartTime', 'SeatsRemaining'] },
        theatres: { idField: 'TheatreID', fields: ['Capacity'] },
        tickets: { idField: 'TicketID', fields: ['BookingID', 'ScreeningID', 'TicketType', 'Cost'] },
        ticketTypes: { idField: 'TicketTypeID', fields: ['Cost'] }
    };

    // Fetch data from API
    const fetchData = async () => {
        try {
            const res = await fetch(`/api/${activeCollection}`);
            items = await res.json();
            populateTable(items);
        } catch (error) {
            showError(`Error fetching data: ${error.message}`);
        }
    };

    // Generate form fields
    const generateFormFields = () => {
        itemForm.innerHTML = '';
        const config = collectionConfig[activeCollection];
        const isEditing = !!currentItem;

        const createFormGroup = (fieldName, inputElement) => {
            const group = document.createElement('div');
            group.className = 'form-group';
            
            const label = document.createElement('label');
            label.textContent = fieldName;
            label.htmlFor = inputElement.id;
            
            group.appendChild(label);
            group.appendChild(inputElement);
            return group;
        };

        // Add ID field for creation
        if (!isEditing) {
            const idInput = document.createElement('input');
            idInput.type = 'text';
            idInput.id = `item-${config.idField}`;
            idInput.name = config.idField;
            idInput.required = true;
            
            const idGroup = createFormGroup(config.idField, idInput);
            itemForm.appendChild(idGroup);
        }

        // Add other fields
        config.fields.forEach(field => {
            const input = document.createElement('input');
            input.id = `item-${field}`;
            input.name = field;
            input.required = true;

            // Set input types and validation
            switch(field) {
                case 'Date':
                    input.type = 'date';
                    input.min = new Date().toISOString().split('T')[0];
                    break;
                case 'StartTime':
                    input.type = 'time';
                    input.min = '09:00';
                    input.max = '23:00';
                    break;
                case 'Cost':
                case 'SeatsRemaining':
                case 'Capacity':
                case 'NoOfSeats':
                    input.type = 'number';
                    input.min = 0;
                    if (field === 'Cost') input.step = 0.01;
                    break;
                case 'EmailAddress':
                    input.type = 'email';
                    break;
                default:
                    input.type = 'text';
            }

            const group = createFormGroup(field, input);
            itemForm.appendChild(group);
        });

        // Submit button
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'submit-button';
        submitButton.textContent = currentItem ? 'Update' : 'Create';
        itemForm.appendChild(submitButton);
    };

    // Populate table with data
    const populateTable = (items) => {
        itemsTableBody.innerHTML = "";
        const config = collectionConfig[activeCollection];

        items.forEach(item => {
            const row = document.createElement("tr");
            const itemId = item[config.idField];
            
            // Info dropdown
            const infoDropdown = document.createElement('select');
            infoDropdown.className = 'info-select';
            config.fields.forEach(field => {
                const option = document.createElement('option');
                option.value = field;
                option.textContent = `${field}: ${item[field] || 'N/A'}`;
                infoDropdown.appendChild(option);
            });

            row.innerHTML = `
                <td>${itemId}</td>
                <td></td>
                <td>
                    <button class="edit-button" data-id="${itemId}">Edit</button>
                    <button class="delete-button" data-id="${itemId}">Delete</button>
                </td>
            `;
            row.querySelector('td:nth-child(2)').appendChild(infoDropdown);
            itemsTableBody.appendChild(row);
        });

        // Add event listeners
        document.querySelectorAll(".edit-button").forEach(button => {
            button.addEventListener("click", () => editItem(button.dataset.id));
        });

        document.querySelectorAll(".delete-button").forEach(button => {
            button.addEventListener("click", () => deleteItem(button.dataset.id));
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        const config = collectionConfig[activeCollection];
        const formData = new FormData(itemForm);
        const payload = {};

        try {
            // Handle ID field for creation
            if (!currentItem) {
                const idValue = formData.get(config.idField);
                if (!idValue) throw new Error(`${config.idField} is required`);
                payload[config.idField] = idValue;
            }

            // Process other fields
            config.fields.forEach(field => {
                const value = formData.get(field);
                if (!value && value !== 0) throw new Error(`${field} is required`);

                // Convert numeric fields
                if (['Cost', 'SeatsRemaining', 'Capacity', 'NoOfSeats'].includes(field)) {
                    payload[field] = Number(value);
                } else {
                    payload[field] = value.trim();
                }
            });

            const url = currentItem 
                ? `/api/${activeCollection}/${currentItem[config.idField]}`
                : `/api/${activeCollection}`;

            const response = await fetch(url, {
                method: currentItem ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Request failed');
            }

            fetchData();
            closeModal();
        } catch (error) {
            showError(`Error: ${error.message}`);
        }
    };

    // Edit item
    const editItem = (id) => {
        const config = collectionConfig[activeCollection];
        currentItem = items.find(item => item[config.idField] === id);
        
        if (!currentItem) {
            showError("Item not found!");
            return;
        }

        generateFormFields();
        
        // Populate form fields
        config.fields.forEach(field => {
            const input = document.querySelector(`#item-${field}`);
            if (input) {
                let value = currentItem[field];
                if (typeof value === 'number' && field === 'Cost') {
                    value = value.toFixed(2);
                }
                input.value = value || '';
            }
        });

        openModal();
    };

    // Delete item
    const deleteItem = async (id) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        
        try {
            const response = await fetch(`/api/${activeCollection}/${id}`, { 
                method: 'DELETE' 
            });
            
            if (!response.ok) throw new Error('Delete failed');
            fetchData();
        } catch (error) {
            showError(`Error deleting item: ${error.message}`);
        }
    };

    // Helper functions
    const showError = (message) => {
        console.error(message);
        alert(message);
    };

    const openModal = () => {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
        currentItem = null;
        itemForm.reset();
    };

    // Event listeners for sidebar buttons
    collections.forEach(collection => {
        collection.addEventListener("click", () => {
            // Remove highlight from previous button
            if (activeCollectionButton) {
                activeCollectionButton.classList.remove('active');
            }

            // Set new active collection
            activeCollection = collection.dataset.collection;
            collectionTitle.textContent = activeCollection;

            // Highlight new button
            collection.classList.add('active');
            activeCollectionButton = collection;

            fetchData();
        });
    });

    // Set initial active button on page load
    const initialButton = document.querySelector(`[data-collection="${activeCollection}"]`);
    if (initialButton) {
        initialButton.classList.add('active');
        activeCollectionButton = initialButton;
    }

    // Other event listeners
    createButton.addEventListener("click", () => {
        currentItem = null;
        generateFormFields();
        openModal();
    });

    closeButton.addEventListener("click", closeModal);
    itemForm.addEventListener("submit", handleSubmit);

    // Initial load
    fetchData();
});