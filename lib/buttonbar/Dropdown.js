export default function getDropdown() {
  const dropdownMenu = document.createElement("div");
  dropdownMenu.classList.add("dd-dropdown-menu");

  dropdownMenu.populate = function (
    options,
    onChange,
    element,
    labelFunc = (x) => x.name || x.plane.modelElement.name || x,
  ) {
    this.innerHTML = "";

    for (const option of options) {
      const entry = document.createElement("div");
      entry.option = option;
      entry.classList.add("dd-dropdown-entry");
      entry.innerHTML = labelFunc(option);
      entry.addEventListener("click", (event) => {
        onChange(option, element, event);
      });
      this.appendChild(entry);
    }
  };

  dropdownMenu.addCreateElementInput = function (onConfirm) {
    const createNewElementEditorContainer = document.createElement("div");
    createNewElementEditorContainer.classList.add("dd-dropdown-create-input");
    const createNewElementEditor = document.createElement("input");
    createNewElementEditor.type = "text";
    createNewElementEditor.placeholder = "Create new OLC";
    createNewElementEditor.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        onConfirm(event);
      }
    });
    createNewElementEditorContainer.appendChild(createNewElementEditor);
    this.appendChild(createNewElementEditorContainer);
  };

  dropdownMenu.getInputValue = function () {
    const inputElements = dropdownMenu.getElementsByTagName("input");
    return inputElements[0] ? inputElements[0].value : "";
  };

  return dropdownMenu;
}
