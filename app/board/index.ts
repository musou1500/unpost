export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

type BlockBase = {
  id: string;
};

export type BlockText = BlockBase & {
  type: "text";
  text: string;
};

export type BlockImage = BlockBase & {
  type: "image";
  url: string;
};

export type Block = BlockText | BlockImage;

export interface State {
  blocks: Map<
    string,
    {
      block: Block;
      position: Position;
      size: Size;
    }
  >;

  blockIds: string[];
}

export type Actions =
  | {
      type: "add-block";
      block: Block;
      position: {
        x: number;
        y: number;
      };
      width: number;
      height: number;
    }
  | {
      type: "remove";
      blockId: string;
    }
  | {
      type: "set-text";
      blockId: string;
      text: string;
    }
  | {
      type: "move";
      blockId: string;
      position: {
        x: number;
        y: number;
      };
    }
  | {
      type: "resize";
      blockId: string;
      size: {
        width: number;
        height: number;
      };
    }
  | {
      type: "bring-to-front";
      blockId: string;
    }
  | {
      type: "bring-to-back";
      blockId: string;
    };

export const reducer = (state: State, action: Actions): State => {
  switch (action.type) {
    case "remove": {
      const blocks = new Map(state.blocks);
      blocks.delete(action.blockId);
      return {
        ...state,
        blocks,
        blockIds: state.blockIds.filter((id) => id !== action.blockId),
      };
    }
    case "resize": {
      const blocks = new Map(state.blocks);
      const block = blocks.get(action.blockId);
      if (!block) return state;
      blocks.set(action.blockId, {
        ...block,
        size: action.size,
      });
      return {
        ...state,
        blocks,
      };
    }
    case "set-text": {
      const blocks = new Map(state.blocks);
      const block = blocks.get(action.blockId);
      if (!block || block.block.type !== "text") return state;
      blocks.set(action.blockId, {
        ...block,
        block: {
          ...block.block,
          text: action.text,
        },
      });
      return {
        ...state,
        blocks,
      };
    }
    case "move": {
      const blocks = new Map(state.blocks);
      const block = blocks.get(action.blockId);
      if (!block) return state;
      blocks.set(action.blockId, {
        ...block,
        position: action.position,
      });
      return {
        ...state,
        blocks,
      };
    }
    case "bring-to-front": {
      if (!state.blocks.has(action.blockId)) return state;
      return {
        ...state,
        blockIds: state.blockIds
          .filter((id) => id !== action.blockId)
          .concat(action.blockId),
      };
    }
    case "bring-to-back": {
      if (!state.blocks.has(action.blockId)) return state;
      return {
        ...state,
        blockIds: [
          action.blockId,
          ...state.blockIds.filter((id) => id !== action.blockId),
        ],
      };
    }
    case "add-block": {
      const blocks = new Map(state.blocks);
      blocks.set(action.block.id, {
        block: action.block,
        position: action.position,
        size: {
          width: action.width,
          height: action.height,
        },
      });
      return {
        ...state,
        blocks,
        blockIds: [...state.blockIds, action.block.id],
      };
    }
    default:
      return state;
  }
};

export const initialState: State = {
  blockIds: [],
  blocks: new Map(),
};
