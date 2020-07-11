import {
  getElememtSize,
  getContainer,
  cursorType,
  getParent,
  getContainWindow,
  getOffset,
  getContainDocument
} from "./util";
import { nextTicket } from "../components/util";
import { cloneDeep } from "lodash-es";

export interface selectionType {
  isCollapsed: boolean;
  selectStructure?: boolean;
  range: [cursorType, cursorType];
}

let selectionStore: selectionType = {
  isCollapsed: true,
  selectStructure: false,
  range: [
    {
      id: "",
      offset: 0
    },
    {
      id: "",
      offset: 0
    }
  ]
};

let flushTimer: number;

// 至少隔 300 毫秒后，才能保存当前选取的内容，避免过度触发该 API
const flushSelection = () => {
  if (flushTimer) return;
  getSelection();
  flushTimer = setTimeout(() => {
    flushTimer = 0;
  }, 300);
};

// 获得之前选区的内容
const getBeforeSelection = () => {
  return cloneDeep<selectionType>(selectionStore);
};

// 用于判断是否在同一个事件循环中，避免多次 getSelection ，而结果是同一内容
let isSameLoop = false;

// 获取选区信息，从 range[0].id 组件的 offset 位置开始，到 range[1].id 的 offset 位置结束
const getSelection = () => {
  if (isSameLoop) return cloneDeep<selectionType>(selectionStore);
  isSameLoop = true;
  nextTicket(() => {
    isSameLoop = false;
  });

  let section = getContainWindow().getSelection();
  // 无选区：直接返回保存的选区内容
  if (
    !section ||
    !section.anchorNode ||
    !section.focusNode ||
    section?.type === "None"
  ) {
    return selectionStore;
  }

  let anchorNode = section?.anchorNode;

  // 当选区不在生成的文章中时，直接返回之前的选区对象
  let rootDom = getContainDocument().getElementById("zebra-editor-contain");
  if (!rootDom?.contains(anchorNode)) {
    return cloneDeep<selectionType>(selectionStore);
  }

  // Chrome 的光标会在表格之后
  // 选中了结构组件的直接子节点：返回该直接子节点
  // FIXED: 目前 Table 不可以被选中
  // if (
  //   // @ts-ignore
  //   anchorNode.dataset &&
  //   // @ts-ignore
  //   anchorNode.dataset.structure === StructureType.structure
  // ) {
  //   // @ts-ignore
  //   let component = getBlockById<StructureCollection>(anchorNode.id);
  //   let child = component.getChild(section.anchorOffset - 1);
  //   return {
  //     isCollapsed: true,
  //     selectStructure: true,
  //     range: [
  //       {
  //         id: child?.id || "",
  //         offset: section.anchorOffset
  //       },
  //       {
  //         id: child?.id || "",
  //         offset: section.anchorOffset
  //       }
  //     ]
  //   };
  // }

  // 判断开始节点和结束节点的位置关系，
  // 0：同一节点
  // 2：focusNode 在 anchorNode 节点前
  // 4：anchorNode 在 focusNode 节点前
  // 获得选区的开始节点和结束节点（文档顺序）
  let posiType = section.anchorNode.compareDocumentPosition(section.focusNode);
  let anchorOffect = section.anchorOffset;
  let focusOffset = section.focusOffset;
  let startOffset;
  let startNode;
  let endOffset;
  let endNode;
  if (posiType === 0) {
    if (anchorOffect > focusOffset) {
      startOffset = focusOffset;
      startNode = section?.focusNode;
      endOffset = anchorOffect;
      endNode = section?.anchorNode;
    } else {
      startOffset = anchorOffect;
      startNode = section?.anchorNode;
      endOffset = focusOffset;
      endNode = section?.focusNode;
    }
  } else if (posiType === 2) {
    startOffset = focusOffset;
    startNode = section?.focusNode;
    endOffset = anchorOffect;
    endNode = section?.anchorNode;
  } else {
    startOffset = anchorOffect;
    startNode = section?.anchorNode;
    endOffset = focusOffset;
    endNode = section?.focusNode;
  }

  // 修正光标节点的位置
  // 获得光标距离所在段落的位置
  let startParent: HTMLElement = getParent(startNode);
  let startContainer: HTMLElement = getContainer(startNode);
  let endParent: HTMLElement = getParent(endNode);
  let endContainer: HTMLElement = getContainer(endNode);
  startOffset = getOffset(startParent, startContainer, startOffset);
  endOffset = getOffset(endParent, endContainer, endOffset);

  // 修复：当全选中某个段落时，focusNode 有可能是下一行的第 0 个位置
  // TODO: 仅发生在选中一个段落时，若有问题，可以查看此处
  if (startParent.id !== endParent.id && startOffset === 0 && endOffset === 0) {
    endOffset = getElememtSize(startParent);
    endParent = startParent;
  }

  // 保存选区信息
  selectionStore = {
    isCollapsed:
      section?.isCollapsed === undefined ? true : section.isCollapsed,
    range: [
      {
        id: startParent.id,
        offset: startOffset
      },
      {
        id: endParent.id,
        offset: endOffset
      }
    ]
  };
  return cloneDeep<selectionType>(selectionStore);
};

export default getSelection;

export { flushSelection, getBeforeSelection };
