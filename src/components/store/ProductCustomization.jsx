import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { base44 } from '@/api/localClient';
import { Plus, Trash2, Upload, Loader2, X, ZoomIn } from 'lucide-react';

const colorOptions = {
  'אדום': '#EF4444', 'כחול': '#3B82F6', 'ירוק': '#22C55E',
  'ורוד': '#EC4899', 'צהוב': '#EAB308', 'סגול': '#A855F7',
  'כתום': '#F97316', 'תכלת': '#06B6D4',
};

// Names list field – for bulk orders
function NamesListField({ label, value, onChange }) {
  const names = value ? value.split('\n') : [];

  const updateNames = (newNames) => {
    onChange(newNames.join('\n'));
  };

  const addName = () => updateNames([...names, '']);
  const removeName = (i) => updateNames(names.filter((_, idx) => idx !== i));
  const editName = (i, val) => {
    const updated = [...names];
    updated[i] = val;
    updateNames(updated);
  };

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
        <span className="text-sm text-gray-500">{names.length} שמות</span>
        <Button type="button" variant="outline" size="sm" className="rounded-lg text-xs self-start" onClick={addName}>
          <Plus className="w-3 h-3 ml-1" /> הוסף שם
        </Button>
      </div>
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {names.map((name, i) => (
          <div key={`${label}-${i}`} className="flex gap-2 items-center">
            <span className="text-xs text-gray-400 w-6 text-center">{i + 1}</span>
            <Input
              value={name}
              onChange={(e) => editName(i, e.target.value)}
              placeholder={`שם ${i + 1}`}
              className="rounded-lg h-10 text-sm flex-1 min-w-0"
            />
            <button type="button" onClick={() => removeName(i)} className="text-gray-400 hover:text-red-500">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      {names.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-3 border border-dashed rounded-xl">לחצו "הוסף שם" להתחלה</p>
      )}
    </div>
  );
}

// Multi-image upload field for customer (unlimited)
function ImageUploadField({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);

  // value stored as JSON array string
  const images = (() => {
    try { const a = JSON.parse(value); return Array.isArray(a) ? a : value ? [value] : []; }
    catch { return value ? [value] : []; }
  })();

  const save = (arr) => onChange(JSON.stringify(arr));

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const urls = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url)));
    save([...images, ...urls]);
    setUploading(false);
  };

  const remove = (i) => save(images.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((url, i) => (
          <div key={i} className="relative w-20 h-20">
            <img src={url} alt="" className="w-full h-full object-cover rounded-xl border" />
            <button type="button" onClick={() => remove(i)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#B68AD8] transition-colors">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-[#B68AD8]" /> : <Upload className="w-5 h-5 text-gray-400" />}
          <span className="text-xs text-gray-400 mt-1">{uploading ? 'מעלה...' : 'הוסף'}</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
        </label>
      </div>
      {images.length > 0 && <p className="text-xs text-gray-400">{images.length} תמונות הועלו</p>}
    </div>
  );
}

export default function ProductCustomization({ options, values, onChange, designOptions, selectedDesign, onDesignChange }) {
  const hasDesigns = designOptions?.length > 0;
  const [previewDesign, setPreviewDesign] = useState(null);

  return (
    <div className="space-y-5">
      {/* Design picker */}
      {hasDesigns && (
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-3">בחרו עיצוב גרפי</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {designOptions.map((d, i) => (
              <div key={i} className="relative group">
                <button
                  type="button"
                  onClick={() => onDesignChange(d.name)}
                  className={`relative rounded-2xl overflow-hidden border-2 aspect-square transition-all w-full ${
                    selectedDesign === d.name ? 'border-[#B68AD8] shadow-lg scale-105' : 'border-gray-200 hover:border-[#B68AD8]/50'
                  }`}
                >
                  <img src={d.image_url} alt={d.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs py-1 text-center">{d.name}</div>
                  {selectedDesign === d.name && (
                    <div className="absolute top-1 right-1 bg-[#B68AD8] rounded-full w-5 h-5 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
                {/* Zoom button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPreviewDesign(d); }}
                  className="absolute top-1 left-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Design preview popup */}
      <Dialog open={!!previewDesign} onOpenChange={() => setPreviewDesign(null)}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] p-0 overflow-hidden rounded-2xl">
          {previewDesign && (
            <div>
              <img src={previewDesign.image_url} alt={previewDesign.name} className="w-full object-contain max-h-[70vh]" />
              <div className="p-4 flex items-center justify-between">
                <span className="font-bold text-lg">{previewDesign.name}</span>
                <Button
                  onClick={() => { onDesignChange(previewDesign.name); setPreviewDesign(null); }}
                  className="bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl"
                >
                  {selectedDesign === previewDesign.name ? '✓ נבחר' : 'בחירת עיצוב'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Customization fields */}
      {options?.length > 0 && (
        <div>
          {hasDesigns && <h3 className="font-bold text-gray-900 text-lg mb-3">התאמה אישית</h3>}
          {!hasDesigns && <h3 className="font-bold text-gray-900 text-lg mb-3">התאמה אישית</h3>}
          <div className="space-y-4">
            {options.map((opt, i) => (
              <div key={i}>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  {opt.label} {opt.required && <span className="text-red-500">*</span>}
                </Label>

                {opt.type === 'text' && (
                  <Input
                    placeholder={`הזינו ${opt.label}`}
                    value={values[opt.label] || ''}
                    onChange={(e) => onChange({ ...values, [opt.label]: e.target.value })}
                    className="rounded-xl h-11"
                  />
                )}

                {opt.type === 'names_list' && (
                  <NamesListField
                    label={opt.label}
                    value={values[opt.label] || ''}
                    onChange={(v) => onChange({ ...values, [opt.label]: v })}
                  />
                )}

                {opt.type === 'select' && (
                  <Select
                    value={values[opt.label] || ''}
                    onValueChange={(v) => onChange({ ...values, [opt.label]: v })}
                  >
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder={`בחרו ${opt.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {opt.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}

                {opt.type === 'color' && (
                  <div className="flex flex-wrap gap-2">
                    {(opt.options || Object.keys(colorOptions)).map(c => {
                      const hex = colorOptions[c] || c;
                      const isSelected = values[opt.label] === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => onChange({ ...values, [opt.label]: c })}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            isSelected ? 'border-gray-900 scale-110 shadow-lg' : 'border-gray-200 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={c}
                        />
                      );
                    })}
                  </div>
                )}

                {opt.type === 'image' && (
                  <ImageUploadField
                    label={opt.label}
                    value={values[opt.label] || ''}
                    onChange={(v) => onChange({ ...values, [opt.label]: v })}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
