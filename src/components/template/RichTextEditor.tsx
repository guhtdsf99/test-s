import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit, { StarterKitOptions } from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign, { TextAlignOptions } from '@tiptap/extension-text-align';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link2, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Extend the Commands interface to include text align commands
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textAlign: {
      setTextAlign: (alignment: string) => ReturnType;
      unsetTextAlign: () => ReturnType;
      toggleTextAlign: (alignment: string) => ReturnType;
    };
  }
}

// Extend the TextAlignOptions to include alignments and defaultAlignment
interface ExtendedTextAlignOptions extends TextAlignOptions {
  alignments: string[];
  defaultAlignment: string;
}

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const editorRef = useRef<Editor | null>(null);

  // Handle image insertion from the parent component
  useEffect(() => {
    const handleImageInsert = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (editorRef.current && customEvent.detail) {
        editorRef.current.chain().focus().setImage({ 
          src: customEvent.detail, 
          alt: 'Uploaded image' 
        }).run();
      }
    };

    window.addEventListener('insert-image', handleImageInsert as EventListener);
    return () => {
      window.removeEventListener('insert-image', handleImageInsert as EventListener);
    };
  }, []);

  const editor = useEditor({
    onUpdate: ({ editor }) => {
      editorRef.current = editor;
    },
    extensions: [
      StarterKit.configure({
        // Disable the built-in text align and use the extension instead
      } as Partial<StarterKitOptions>),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      } as TextAlignOptions & { alignments: string[]; defaultAlignment: string }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setIsLinkDialogOpen(false);
    }
  };

  const addImage = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run();
      setImageUrl('');
      setImageAlt('');
      setIsImageDialogOpen(false);
    }
  };

  return (
    <div className="border rounded-md">
      <div className="border-b p-1 flex flex-wrap gap-1">
        <ToggleGroup type="multiple" className="w-full flex-wrap justify-start">
          <ToggleGroupItem value="bold" onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" onClick={() => editor.chain().focus().toggleMark('underline').run()}>
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="strike" onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="h-4 w-4" />
          </ToggleGroupItem>
          
          <div className="h-8 w-px bg-gray-300 mx-1" />
          
          <ToggleGroupItem value="bullet" onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="ordered" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </ToggleGroupItem>
          
          <div className="h-8 w-px bg-gray-300 mx-1" />
          
          <ToggleGroupItem 
            value="left" 
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            data-active={editor?.isActive({ textAlign: 'left' })}
          >
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="center" 
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            data-active={editor?.isActive({ textAlign: 'center' })}
          >
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="right" 
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            data-active={editor?.isActive({ textAlign: 'right' })}
          >
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="justify" 
            onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
            data-active={editor?.isActive({ textAlign: 'justify' })}
          >
            <AlignJustify className="h-4 w-4" />
          </ToggleGroupItem>
          
          <div className="h-8 w-px bg-gray-300 mx-1" />
          
          <ToggleGroupItem value="link" onClick={() => setIsLinkDialogOpen(true)}>
            <Link2 className="h-4 w-4" />
          </ToggleGroupItem>
          
          <ToggleGroupItem value="image" onClick={() => setIsImageDialogOpen(true)}>
            <ImageIcon className="h-4 w-4" />
          </ToggleGroupItem>
          
          <Select
            onValueChange={(value) => {
              if (editor) {
                editor.chain().focus().setColor(`#${value}`).run();
              }
            }}
          >
            <SelectTrigger className="w-[100px] h-8 ml-1">
              <SelectValue placeholder="Text color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="#000000">Black</SelectItem>
              <SelectItem value="#ff0000">Red</SelectItem>
              <SelectItem value="#00ff00">Green</SelectItem>
              <SelectItem value="#0000ff">Blue</SelectItem>
              <SelectItem value="#ff9900">Orange</SelectItem>
              <SelectItem value="#9900ff">Purple</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            onValueChange={(value) => {
              if (!editor) return;
              if (value === 'paragraph') {
                editor.chain().focus().setParagraph().run();
              } else {
                const level = parseInt(value) as 1 | 2 | 3 | 4 | 5 | 6;
                editor.chain().focus().toggleHeading({ level }).run();
              }
            }}
          >
            <SelectTrigger className="w-[120px] h-8 ml-1">
              <SelectValue placeholder="Text style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paragraph">Paragraph</SelectItem>
              <SelectItem value="1">Heading 1</SelectItem>
              <SelectItem value="2">Heading 2</SelectItem>
              <SelectItem value="3">Heading 3</SelectItem>
            </SelectContent>
          </Select>
        </ToggleGroup>
      </div>
      
      <div className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
        <EditorContent editor={editor} className="prose max-w-none" />
      </div>
      
      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addLink}>Add Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageAlt">Alt Text</Label>
              <Input
                id="imageAlt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Description of the image"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addImage}>Insert Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
