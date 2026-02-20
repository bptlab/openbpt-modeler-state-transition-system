import { classes as domClasses } from "min-dom";

import getDropdown from "./Dropdown";
import { appendOverlayListeners } from "../util/HtmlUtil";
import OlcEvents from "../OlcEvents";

export default function OlcButtonBar(canvas, eventBus, injector) {  
  function getCustomModeler() {
    return injector.get("customModeler");
  }

  // Create component after import is done to ensure that the button bar is only created after the initial diagram is rendered
  eventBus.on("import.parse.complete", (context) => {
    const container = canvas.getContainer().parentElement;
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
      selectedOlcSpan.innerText = this.value
        ? this.value.plane.modelElement.name
        : "";
    };

    // Show first imported olc if there is one
    if (context.definitions.get("diagrams").length > 0) {
      selectOlcComponent.showValue(context.definitions.get("diagrams")[0]);
    }

    const selectOlcMenu = getDropdown();
    selectOlcComponent.addEventListener("click", (event) => {
      if (
        event.target === selectOlcComponent ||
        event.target === selectedOlcSpan
      ) {
        repopulateDropdown();
        showSelectOlcMenu();
      } else {
        return;
      }
    });
    selectOlcComponent.addEventListener("dblclick", (event) => {
      if (
        selectOlcComponent.value &&
        (event.target === selectOlcComponent || event.target === selectedOlcSpan)
      ) {
        selectOlcMenu.hide();
        const renameOlcInput = document.createElement("input");
        renameOlcInput.value = selectOlcComponent.value.plane.modelElement.name;
        renameOlcInput.addEventListener("change", function (event) {
          renameOlcInput.blur();
          getCustomModeler()
            .get("modeling")
            .updateLabel(
              selectOlcComponent.value.plane.modelElement.name,
              renameOlcInput.value,
            );
        });
        renameOlcInput.addEventListener("focusout", function (event) {
          selectOlcComponent.replaceChild(selectedOlcSpan, renameOlcInput);
        });

        selectOlcComponent.replaceChild(renameOlcInput, selectedOlcSpan);
        //Timeout because focus is immediately lost if set immediately
        setTimeout(() => renameOlcInput.focus(), 100);
      } else {
        return;
      }
    });
    selectOlcComponent.appendChild(selectedOlcSpan);
    buttonBar.appendChild(selectOlcComponent);

    // Delete olc button
    const deleteOlcButton = document.createElement("button");
    deleteOlcButton.innerHTML = "🗑️";
    deleteOlcButton.title = "Delete Current Olc";
    deleteOlcButton.addEventListener("click", () => {
      const diagramToDelete = selectOlcComponent.value;
      getCustomModeler().deleteModelAndDiagram(
        diagramToDelete.plane.modelElement,
        diagramToDelete,
      );
    });
    buttonBar.appendChild(deleteOlcButton);

    selectOlcMenu.handleClick = (event) => {
      return selectOlcMenu.contains(event.target);
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
      deleteOlcButton.hidden = diagrams.length === 1;
      selectOlcComponent.showValue(valueBefore);
    }

    function showSelectOlcMenu() {
      const closeOverlay = appendOverlayListeners(selectOlcMenu);
      selectOlcMenu.style.display = "block";
      selectOlcComponent.appendChild(selectOlcMenu);
      eventBus.once("element.contextmenu", (event) => {
        closeOverlay(event);
        event.preventDefault();
      });
      selectOlcMenu.hide = closeOverlay;
    }

    eventBus.on([OlcEvents.DEFINITIONS_CHANGED], (event) => repopulateDropdown());
    eventBus.on([OlcEvents.SELECTED_OLC_CHANGED], (event) => {
      selectOlcComponent.showValue(event.diagram);
    }); 
  });
}

OlcButtonBar.$inject = ["canvas", "eventBus", "injector"];
