import { Editor, Transforms } from "slate";
import { ReactEditor } from "slate-react";

export const withImages = (editor) => {
  const { isVoid } = editor;

  editor.isVoid = (element) =>
    element.type === "image" ? true : isVoid(element);

  return editor;
};

export const insertImage = (editor, url, filename) => {
  ReactEditor.focus(editor);

  if (!editor.selection) {
    const end = Editor.end(editor, []);
    Transforms.select(editor, end);
  }

  const image = {
    type: "image",
    url,
    filename,
    children: [{ text: "" }],
  };

  Transforms.insertNodes(editor, image);

  Transforms.insertNodes(editor, {
    type: "paragraph",
    children: [{ text: "" }],
  });

  Transforms.collapse(editor, { edge: "end" });
};

export const createInitialValue = (value) => {
  if (Array.isArray(value) && value.length > 0) {
    return value;
  }

  return [
    {
      type: "paragraph",
      children: [{ text: "" }],
    },
  ];
};
