import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    ListOrdered,
    Image as ImageIcon,
    Link as LinkIcon,
    Table as TableIcon,
    Palette,
    Highlighter,
    Upload,
} from 'lucide-react';

interface TemplateEditorProps {
    content: string;
    onChange: (content: string) => void;
}

export const TemplateEditor = ({ content, onChange }: TemplateEditorProps) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showHighlightPicker, setShowHighlightPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            FontFamily.configure({
                types: ['textStyle'],
            }),
            Highlight.configure({
                multicolor: true,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline cursor-pointer',
                },
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[500px] max-w-none p-8 bg-white',
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        event.preventDefault();
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const base64 = e.target?.result as string;
                            const { schema } = view.state;
                            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                            if (coordinates) {
                                const node = schema.nodes.image.create({ src: base64 });
                                const transaction = view.state.tr.insert(coordinates.pos, node);
                                view.dispatch(transaction);
                            }
                        };
                        reader.readAsDataURL(file);
                        return true;
                    }
                }
                return false;
            },
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items;
                if (items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf('image') !== -1) {
                            event.preventDefault();
                            const file = items[i].getAsFile();
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                    const base64 = e.target?.result as string;
                                    editor?.chain().focus().setImage({ src: base64 }).run();
                                };
                                reader.readAsDataURL(file);
                            }
                            return true;
                        }
                    }
                }
                return false;
            },
        },
    });

    const setFontFamily = useCallback((font: string) => {
        editor?.chain().focus().setFontFamily(font).run();
    }, [editor]);

    const setFontSize = useCallback((size: string) => {
        editor?.chain().focus().setMark('textStyle', { fontSize: size }).run();
    }, [editor]);

    const setTextColor = useCallback((color: string) => {
        editor?.chain().focus().setColor(color).run();
        setShowColorPicker(false);
    }, [editor]);

    const setHighlight = useCallback((color: string) => {
        editor?.chain().focus().setHighlight({ color }).run();
        setShowHighlightPicker(false);
    }, [editor]);

    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                editor?.chain().focus().setImage({ src: base64 }).run();
            };
            reader.readAsDataURL(file);
        }
    }, [editor]);

    const addImage = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const addLink = useCallback(() => {
        const previousUrl = editor?.getAttributes('link').href;
        const url = window.prompt('Enter URL:', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const addTable = useCallback(() => {
        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }, [editor]);

    if (!editor) {
        return null;
    }

    const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'];

    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xl">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />

            {/* Toolbar */}
            <div className="border-b border-slate-200 bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10">
                {/* First Row - Font and Size */}
                <div className="flex items-center gap-2 p-2 border-b border-slate-200">
                    <Select onValueChange={setFontFamily}>
                        <SelectTrigger className="w-[140px] h-8 text-xs bg-white">
                            <SelectValue placeholder="Calibri" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Calibri, sans-serif">Calibri</SelectItem>
                            <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                            <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                            <SelectItem value="Georgia, serif">Georgia</SelectItem>
                            <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                            <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                            <SelectItem value="'Comic Sans MS', cursive">Comic Sans MS</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select onValueChange={setFontSize}>
                        <SelectTrigger className="w-[70px] h-8 text-xs bg-white">
                            <SelectValue placeholder="12" />
                        </SelectTrigger>
                        <SelectContent>
                            {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map((size) => (
                                <SelectItem key={size} value={`${size}pt`}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="h-6 w-px bg-slate-300 mx-1" />

                    {/* Text Formatting */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-slate-200' : ''}`}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-slate-200' : ''}`}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-slate-200' : ''}`}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                    >
                        <UnderlineIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-slate-200' : ''}`}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                    >
                        <Strikethrough className="h-4 w-4" />
                    </Button>

                    <div className="h-6 w-px bg-slate-300 mx-1" />

                    {/* Colors */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                        >
                            <Palette className="h-4 w-4" />
                        </Button>
                        {showColorPicker && (
                            <div className="absolute top-10 left-0 bg-white border border-slate-200 rounded-lg p-2 shadow-lg z-20 flex gap-1">
                                {colors.map((color) => (
                                    <button
                                        key={color}
                                        className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color }}
                                        onClick={() => setTextColor(color)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                        >
                            <Highlighter className="h-4 w-4" />
                        </Button>
                        {showHighlightPicker && (
                            <div className="absolute top-10 left-0 bg-white border border-slate-200 rounded-lg p-2 shadow-lg z-20 flex gap-1">
                                {colors.map((color) => (
                                    <button
                                        key={color}
                                        className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color }}
                                        onClick={() => setHighlight(color)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Second Row - Alignment and Lists */}
                <div className="flex items-center gap-2 p-2 border-b border-slate-200">
                    <Select onValueChange={(value) => {
                        if (value === 'paragraph') editor.chain().focus().setParagraph().run();
                        else if (value === 'heading1') editor.chain().focus().toggleHeading({ level: 1 }).run();
                        else if (value === 'heading2') editor.chain().focus().toggleHeading({ level: 2 }).run();
                        else if (value === 'heading3') editor.chain().focus().toggleHeading({ level: 3 }).run();
                    }}>
                        <SelectTrigger className="w-[120px] h-8 text-xs bg-white">
                            <SelectValue placeholder="Normal" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="paragraph">Normal</SelectItem>
                            <SelectItem value="heading1">Heading 1</SelectItem>
                            <SelectItem value="heading2">Heading 2</SelectItem>
                            <SelectItem value="heading3">Heading 3</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="h-6 w-px bg-slate-300 mx-1" />

                    {/* Alignment */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200' : ''}`}
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    >
                        <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200' : ''}`}
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    >
                        <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200' : ''}`}
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    >
                        <AlignRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-slate-200' : ''}`}
                        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    >
                        <AlignJustify className="h-4 w-4" />
                    </Button>

                    <div className="h-6 w-px bg-slate-300 mx-1" />

                    {/* Lists */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-slate-200' : ''}`}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-slate-200' : ''}`}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                </div>

                {/* Third Row - Insert Options */}
                <div className="flex items-center gap-2 p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={addTable}
                    >
                        <TableIcon className="h-4 w-4 mr-1" />
                        Table
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={addImage}
                    >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload Image
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={addLink}
                    >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Link
                    </Button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="bg-white">
                <EditorContent editor={editor} />
            </div>

            {/* Helper text */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                💡 Tip: You can drag and drop images directly into the editor or paste them from clipboard
            </div>
        </div>
    );
};
