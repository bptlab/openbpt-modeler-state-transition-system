import { assign, omit, findIndex, without } from "min-dash";
import BaseViewer from "./BaseViewer";
import OlcEvents from "./OlcEvents";

// diagram-js modules
import ZoomScrollModule from "diagram-js/lib/navigation/zoomscroll";
import MoveCanvasModule from "diagram-js/lib/navigation/movecanvas";

import BendPointsModule from "diagram-js/lib/features/bendpoints";
import ConnectModule from "diagram-js/lib/features/connect";
import ConnectionPreviewModule from "diagram-js/lib/features/connection-preview";
import ContextPadModule from "diagram-js/lib/features/context-pad";
import CreateModule from "diagram-js/lib/features/create";
import EditorActionsModule from "./common/editor-actions";
import GridSnappingModule from "diagram-js/lib/features/grid-snapping";
import KeyboardMoveSelectionModule from "diagram-js/lib/features/keyboard-move-selection";
import LassoToolModule from "diagram-js/lib/features/lasso-tool";
import ModelingModule from "diagram-js/lib/features/modeling";
import MoveModule from "diagram-js/lib/features/move";
import OutlineModule from "diagram-js/lib/features/outline";
import PaletteModule from "diagram-js/lib/features/palette";
import ResizeModule from "diagram-js/lib/features/resize";
import RulesModule from "diagram-js/lib/features/rules";
import SelectionModule from "diagram-js/lib/features/selection";
import SnappingModule from "diagram-js/lib/features/snapping";
import TranslateModule from "diagram-js/lib/i18n/translate";

// Custom common Modules
import SearchPadModule from "./common/search";
import KeyboardModule from "./common/keyboard";
import CopyPasteModule from "./common/copy-paste";

// Modeler-specific modules
import CustomPaletteModule from "./palette";
import CustomCoreModule from "./core";
import CustomModelingModule from "./modeling";
import CustomRulesModule from "./rules";
import CustomAutoPlaceModule from "./auto-place";
import OlcButtonBarModule from "./buttonbar";

import emptyDiagram from "./util/emptyDiagram";

export default class CustomModeler extends BaseViewer {
  constructor(options) {
    const { additionalModules = [] } = options;

    const builtinModules = [
      ConnectModule,
      ConnectionPreviewModule,
      ContextPadModule,
      CreateModule,
      LassoToolModule,
      ModelingModule,
      MoveCanvasModule,
      MoveModule,
      OutlineModule,
      PaletteModule,
      RulesModule,
      SelectionModule,
      ZoomScrollModule,
      EditorActionsModule,
      KeyboardModule,
      CopyPasteModule,
      GridSnappingModule,
      BendPointsModule,
      ResizeModule,
      SnappingModule,
      KeyboardMoveSelectionModule,
      TranslateModule,
      SearchPadModule,
    ];

    const customModules = [
      CustomPaletteModule,
      CustomCoreModule,
      CustomModelingModule,
      CustomAutoPlaceModule,
      CustomRulesModule,
      OlcButtonBarModule,
    ];

    const modules = [...builtinModules, ...customModules, ...additionalModules];

    const diagramOptions = assign(
      // Keep the original options, but remove additionalModules
      omit(options, ["additionalModules"]),
      // Add the modules as property
      { modules },
    );

    super(diagramOptions);

    const injector = this.get("injector");
    const originalGet = injector.get.bind(injector);

    injector.get = function (name, strict) {
      if (name === "customModeler") {
        return this._customModelerInstance;
      }
      return originalGet(name, strict);
    };

    injector._customModelerInstance = this;

    this.get("eventBus").on(OlcEvents.DEFINITIONS_CHANGED, (event) => {
      const container = this.get("canvas").getContainer();
      const shouldBeVisible = event.definitions.get("models").length !== 0;
      const currentVisibility = container.style.visibility;
      if (
        !currentVisibility ||
        shouldBeVisible !== (currentVisibility !== "hidden")
      ) {
        if (shouldBeVisible) {
          container.style.visibility = "";
        } else {
          container.style.visibility = "hidden";
        }
      }
    });
  }

  createNew() {
    return this.importXML(emptyDiagram);
  }
}

CustomModeler.prototype.addModelAndDiagram = function (name) {
  var model = this.get("customElementFactory").create("olc:Model", {
    name: name || "<TBD>",
  });
  this._definitions.get("models").push(model);
  var diagram = this.get("customElementFactory").create("olcDi:Diagram");
  var plane = this.get("customElementFactory").createDiPlane(model);
  diagram.plane = plane;
  this._definitions.get("diagrams").push(diagram);
  this._emit(OlcEvents.DEFINITIONS_CHANGED, { definitions: this._definitions });
  this.showModel(this._definitions, diagram);
};

CustomModeler.prototype.getDefinitions = function () {
  return this._definitions;
};

CustomModeler.prototype.getDiagrams = function () {
  return this._definitions.get("diagrams");
};

CustomModeler.prototype.deleteModelAndDiagram = function (model, diagram) {
  var currentIndex = findIndex(this._definitions.diagrams, diagram);
  var indexAfterRemoval = Math.min(
    currentIndex,
    this._definitions.diagrams.length - 2,
  );

  this._definitions.models = without(this._definitions.models, model);
  this._definitions.diagrams = without(this._definitions.diagrams, diagram);
  this._emit(OlcEvents.DEFINITIONS_CHANGED, { definitions: this._definitions });

  if (model === this._model) {
    this.showModel(
      this._definitions,
      this._definitions.diagrams[indexAfterRemoval],
    );
  }
};
