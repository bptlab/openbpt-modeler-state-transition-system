import { classes as domClasses } from "min-dom";

import getDropdown from "./Dropdown";
import { appendOverlayListeners } from "../util/HtmlUtil";
import OlcEvents from "../OlcEvents";
import { EDIT_ICON, DELETE_ICON } from "./icons";

export default function OlcButtonBar(canvas, eventBus, injector) {  
  function getCustomModeler() {
    return injector.get("customModeler");
  }

  // Create component after import is done to ensure that the button bar is only created after the initial diagram is rendered
  eventBus.on("import.parse.complete", (context) => {
    const container = canvas.getContainer();
    const buttonBar = document.createElement("div");
    domClasses(buttonBar).add("olc-buttonbar");
    container.appendChild(buttonBar);

    // Select olc Menu
    const selectOlcComponent = document.createElement("div");
    selectOlcComponent.classList.add("olc-select-component");
    const selectedOlcSpan = document.createElement("span");
    selectedOlcSpan.style.userSelect = "none";
    selectOlcComponent.showValue = function (diagram) {
      this.value = diagram;
      selectedOlcSpan.innerText = diagram?.plane?.modelElement?.name ?? "unnamed model";
    };

    // Show first imported olc if there is one
    if (context.definitions.get("diagrams").length > 0) {
      selectOlcComponent.showValue(context.definitions.get("diagrams")[0]);
    }

    const selectOlcMenu = getDropdown();
    let isDropdownOpen = false;
    let closeOverlayFunc = null;

    // Define hide function early so it's always available
    selectOlcMenu.hide = () => {
      if (closeOverlayFunc) {
        closeOverlayFunc();
      }
      isDropdownOpen = false;
    };

    selectOlcComponent.addEventListener("click", (event) => {
      if (
        event.target === selectOlcComponent ||
        event.target === selectedOlcSpan
      ) {
        // If the dropdown is already open, close it instead of reopening.
        if (isDropdownOpen) {
          selectOlcMenu.hide();
          return;
        }

        repopulateDropdown();
        showSelectOlcMenu();
      } else {
        return;
      }
    });
    function startRenaming() {
      if (selectOlcComponent.value) {
        selectOlcMenu.hide();
        const renameOlcInput = document.createElement("input");
        renameOlcInput.value = selectOlcComponent.value.plane.modelElement.name || "";
        renameOlcInput.addEventListener("change", function (event) {
          renameOlcInput.blur();
          getCustomModeler()
            .get("modeling")
            .updateProperty(
              selectOlcComponent.value.plane.modelElement,
              "name",
              renameOlcInput.value,
            );
          selectOlcComponent.showValue(selectOlcComponent.value);
        });
        renameOlcInput.addEventListener("focusout", function (event) {
          selectOlcComponent.replaceChild(selectedOlcSpan, renameOlcInput);
        });

        selectOlcComponent.replaceChild(renameOlcInput, selectedOlcSpan);
        //Timeout because focus is immediately lost if set immediately
        setTimeout(() => renameOlcInput.focus(), 100);
      }
    }

    selectOlcComponent.addEventListener("dblclick", (event) => {
      if (
        selectOlcComponent.value &&
        (event.target === selectOlcComponent || event.target === selectedOlcSpan)
      ) {
        startRenaming();
      } else {
        return;
      }
    });
    selectOlcComponent.appendChild(selectedOlcSpan);
    buttonBar.appendChild(selectOlcComponent);

    // Edit olc button
    const editOlcButton = document.createElement("button");
    editOlcButton.innerHTML = EDIT_ICON;
    editOlcButton.title = "Edit current OLC name";
    editOlcButton.addEventListener("click", () => {
      startRenaming();
    });
    buttonBar.appendChild(editOlcButton);

    // Delete olc button
    const deleteOlcButton = document.createElement("button");
    deleteOlcButton.innerHTML = DELETE_ICON;
    deleteOlcButton.title = "Delete current OLC";
    deleteOlcButton.addEventListener("click", () => {
      const diagramToDelete = selectOlcComponent.value;
      getCustomModeler().deleteModelAndDiagram(
        diagramToDelete.plane.modelElement,
        diagramToDelete,
      );
    });
    buttonBar.appendChild(deleteOlcButton);

    // Use disabled attribute to disable the delete button when only one diagram exists
    function updateDeleteButtonVisibility() {
      const diagrams = getCustomModeler().getDiagrams();
      deleteOlcButton.disabled = diagrams.length === 1;
    }

    selectOlcMenu.handleClick = (event) => {
      // Don't close if clicking inside the menu or on the select component itself
      return selectOlcMenu.contains(event.target) || 
             event.target === selectOlcComponent || 
             event.target === selectedOlcSpan;
    };

    function repopulateDropdown() {
      const diagrams = getCustomModeler().getDiagrams();

      const valueBefore = selectOlcComponent.value;
      selectOlcMenu.populate(diagrams, (diagram) => {
        getCustomModeler().showModel(
          getCustomModeler().getDefinitions(),
          diagram,
        );
        selectOlcMenu.hide();
      });
      selectOlcMenu.addCreateElementInput((event) => {
        const name = selectOlcMenu.getInputValue();
        if (name && name.length > 0) {
          getCustomModeler().addModelAndDiagram(name);
        }
      });
      updateDeleteButtonVisibility();
      selectOlcComponent.showValue(valueBefore);
    }

    function showSelectOlcMenu() {
      const closeOverlay = appendOverlayListeners(selectOlcMenu);
      closeOverlayFunc = closeOverlay;
      selectOlcMenu.style.display = "block";
      selectOlcComponent.appendChild(selectOlcMenu);
      isDropdownOpen = true;
      eventBus.once("element.contextmenu", (event) => {
        closeOverlay(event);
        event.preventDefault();
      });
    }

    eventBus.on([OlcEvents.DEFINITIONS_CHANGED], (event) => repopulateDropdown());
    eventBus.on([OlcEvents.SELECTED_OLC_CHANGED], (event) => {
      selectOlcComponent.showValue(event.diagram);
    }); 
  });
}

OlcButtonBar.$inject = ["canvas", "eventBus", "injector"];
