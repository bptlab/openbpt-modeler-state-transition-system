import {
  MODELER_PREFIX,
  MODELER_DI_PREFIX,
  MODELER_NAMESPACE,
} from "../../util/constants";

const modelSchema = {
  name: "Place Transition nets",
  uri: MODELER_NAMESPACE,
  prefix: MODELER_PREFIX,
  xml: {
    tagAlias: "lowerCase",
  },
  types: [
    {
      name: "Schema",
      isAbstract: true,
      properties: [
        {
          name: "id",
          isAttr: true,
          type: "String",
          isId: true,
        },
        {
          name: "name",
          isAttr: true,
          type: "String",
        },
      ],
    },
    {
      name: "ModelElement",
      isAbstract: true,
      superClass: ["Schema"],
    },
    {
      name: "Node",
      isAbstract: true,
      superClass: ["ModelElement"],
    },
    {
      "name": "State",
      "superClass": [
        "Node"
      ],
      "properties": []
    },
    {
      "name": "Transition",
      "superClass": [
        "ModelElement"
      ],
      "properties": [
        {
          "name": "sourceState",
          "isAttr": true,
          "isReference": true,
          "type": "State"
        },
        {
          "name": "targetState",
          "isAttr": true,
          "isReference": true,
          "type": "State"
        }
      ]
    },
    {
      name: "Model",
      superClass: ["Schema"],
      properties: [
        {
          name: "modelElements",
          type: "ModelElement",
          isMany: true,
        },
      ],
    },
    {
      name: "Definitions",
      superClass: ["Schema"],
      properties: [
        {
          name: "targetNamespace",
          isAttr: true,
          type: "String",
        },
        {
          name: "expressionLanguage",
          default: "http://www.w3.org/1999/XPath",
          isAttr: true,
          type: "String",
        },
        {
          name: "typeLanguage",
          default: "http://www.w3.org/2001/XMLSchema",
          isAttr: true,
          type: "String",
        },
        {
          name: "model",
          type: "Model",
        },
        {
          name: "diagram",
          type: `${MODELER_DI_PREFIX}:Diagram`,
        },
        {
          name: "exporter",
          isAttr: true,
          type: "String",
        },
        {
          name: "exporterVersion",
          isAttr: true,
          type: "String",
        },
      ],
    },
  ],
};

export default modelSchema;
