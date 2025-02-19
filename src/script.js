function newTutoring() {
    console.log("function works");
    document.getElementById("add-tutoring-form").style.display = "block";
    document.getElementById("tutor-content").style.filter = "blur(8px)";
}

function closeTutoring() {
    document.getElementById("add-tutoring-form").style.display = "none";
    document.getElementById("tutor-content").style.filter = "none";
}

function deleteTutoring() {
    document.getElementById("delete-tutor-alert").style.display = "block";
    document.getElementById("tutoring-dashboard").style.filter = "blur(8px)";
}

function closeDeleteTutoring() {
    document.getElementById("delete-tutor-alert").style.display = "none";
    document.getElementById("tutoring-dashboard").style.filter = "none";
}

const input = document.getElementById("subjectInput");
const dropdown = document.getElementById("customDropdown");
const options = dropdown.querySelectorAll("li");

input.addEventListener("focus", () => {
    dropdown.classList.add("show");
});

document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove("show");
    }
});

options.forEach(option => {
    option.addEventListener("click", () => {
        input.value = option.textContent;
        input.setAttribute("value", option.textContent); 
        dropdown.classList.remove("show");
    });
});

input.addEventListener("input", () => {
    const filter = input.value.toLowerCase();
    options.forEach(option => {
        if (option.textContent.toLowerCase().includes(filter)) {
            option.style.display = "block";
        } else {
            option.style.display = "none";
        }
    });
});

const input2 = document.getElementById("languageInput");
const dropdown2 = document.getElementById("customDropdown2");
const options2 = dropdown2.querySelectorAll("li");

input2.addEventListener("focus", () => {
    dropdown2.classList.add("show");
});

document.addEventListener("click", (e) => {
    if (!input2.contains(e.target) && !dropdown2.contains(e.target)) {
        dropdown2.classList.remove("show");
    }
});

options2.forEach(option => {
    option.addEventListener("click", () => {
        input2.value = option.textContent;
        input2.setAttribute("value", option.textContent); 
        dropdown2.classList.remove("show");
    });
});

input2.addEventListener("input", () => {
    const filter = input2.value.toLowerCase();
    options2.forEach(option => {
        if (option.textContent.toLowerCase().includes(filter)) {
            option.style.display = "block";
        } else {
            option.style.display = "none";
        }
    });
});

const input3 = document.getElementById("levelInput");
const dropdown3 = document.getElementById("customDropdown3");
const options3 = dropdown3.querySelectorAll("li");

input3.addEventListener("focus", () => {
    dropdown3.classList.add("show");
});

document.addEventListener("click", (e) => {
    if (!input3.contains(e.target) && !dropdown3.contains(e.target)) {
        dropdown3.classList.remove("show");
    }
});

options3.forEach(option => {
    option.addEventListener("click", () => {
        input3.value = option.textContent;
        input3.setAttribute("value", option.textContent); 
        dropdown3.classList.remove("show");
    });
});

input3.addEventListener("input", () => {
    const filter = input3.value.toLowerCase();
    options3.forEach(option => {
        if (option.textContent.toLowerCase().includes(filter)) {
            option.style.display = "block";
        } else {
            option.style.display = "none";
        }
    });
});

