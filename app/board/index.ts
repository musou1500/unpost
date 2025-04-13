export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Block = {
  type: "text";
  text: string;
};

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

type Actions =
  | {
      type: "addtext";
      block: {
        type: "text";
        text: string;
      };
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
    case "addtext": {
      const blockId = crypto.randomUUID();
      const blocks = new Map(state.blocks);
      blocks.set(blockId, {
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
        blockIds: [...state.blockIds, blockId],
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
