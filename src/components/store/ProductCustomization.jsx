import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPendingOrderAsset } from '@/services/uploadService';
import { Loader2, Plus, Trash2, Upload, X, ZoomIn } from 'lucide-react';

const colorOptions = {
  אדום: '#EF4444',
  כחול: '#3B82F6',
  ירוק: '#22C55E',
  ורוד: '#EC4899',
  צהוב: '#EAB308',
  סגול: '#A855F7',
  כתום: '#F97316',
  תכלת: '#06B6D4',
};

function normalizeNameList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split('\n');
}

function NamesListField({ label, value, onChange }) {
  const names = normalizeNameList(value);

  const updateNames = (nextNames) => {
    onChange(nextNames.join('\n'));
  };

  const addName = () => updateNames([...names, '']);
  const removeName = (index) => updateNames(names.filter((_, currentIndex) => currentIndex !== index));
  const editName = (index, nextValue) => {
    const nextNames = [...names];
    nextNames[index] = nextValue;
    updateNames(nextNames);
  };

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
        <span className="text-sm text-gray-500">{names.filter(name => name.trim()).length} שמות</span>
        <Button type="button" variant="outline" size="sm" className="rounded-lg text-xs self-start" onClick={addName}>
          <Plus className="w-3 h-3 ml-1" /> הוסף שם
        </Button>
      </div>
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {names.map((name, index) => (
          <div key={`${label}-${index}`} className="flex gap-2 items-center">
            <span className="text-xs text-gray-400 w-6 text-center">{index + 1}</span>
            <Input
              value={name}
              onChange={(e) => editName(index, e.target.value)}
              placeholder={`שם ${index + 1}`}
              className="rounded-lg h-10 text-sm flex-1 min-w-0"
            />
            <button type="button" onClick={() => removeName(index)} className="text-gray-400 hover:text-red-500">
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

function normalizeImageValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : value ? [{ file_url: value, file_path: '', file_type: 'image/*', original_filename: 'image' }] : [];
    } catch {
      return value ? [{ file_url: value, file_path: '', file_type: 'image/*', original_filename: 'image' }] : [];
    }
  }
  return [];
}

function ImageUploadField({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const images = normalizeImageValue(value);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploaded = files.map((file, index) => {
        const pendingAsset = {
          ...createPendingOrderAsset(file),
          sort_order: images.length + index,
        };

        console.log('Order asset pending preview created', {
          label,
          asset: {
            file_path: pendingAsset.file_path,
            file_url: pendingAsset.file_url,
            preview_url: pendingAsset.preview_url,
            original_filename: pendingAsset.original_filename,
            file_type: pendingAsset.file_type,
            sort_order: pendingAsset.sort_order,
            hasPendingFile: !!pendingAsset.pending_file,
          },
        });

        return pendingAsset;
      });
      onChange([...images, ...uploaded]);
    } catch (error) {
      console.error('Customization asset upload failed:', error);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = (index) => {
    const nextImages = images
      .filter((_, currentIndex) => currentIndex !== index)
      .map((image, currentIndex) => ({ ...image, sort_order: currentIndex }));
    onChange(nextImages);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((image, index) => (
          <div key={`${image.file_path || image.file_url || image.preview_url}-${index}`} className="relative w-20 h-20">
            <img src={image.preview_url || image.file_url} alt="" className="w-full h-full object-cover rounded-xl border" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow"
            >
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
      {hasDesigns && (
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-3">בחרו עיצוב גרפי</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {designOptions.map((design, index) => (
              <div key={index} className="relative group">
                <button
                  type="button"
                  onClick={() => onDesignChange(design.name)}
                  className={`relative rounded-2xl overflow-hidden border-2 aspect-square transition-all w-full ${
                    selectedDesign === design.name ? 'border-[#B68AD8] shadow-lg scale-105' : 'border-gray-200 hover:border-[#B68AD8]/50'
                  }`}
                >
                  <img src={design.image_url} alt={design.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs py-1 text-center">{design.name}</div>
                  {selectedDesign === design.name && (
                    <div className="absolute top-1 right-1 bg-[#B68AD8] rounded-full w-5 h-5 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewDesign(design);
                  }}
                  className="absolute top-1 left-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!previewDesign} onOpenChange={() => setPreviewDesign(null)}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] p-0 overflow-hidden rounded-2xl">
          {previewDesign && (
            <div>
              <img src={previewDesign.image_url} alt={previewDesign.name} className="w-full object-contain max-h-[70vh]" />
              <div className="p-4 flex items-center justify-between">
                <span className="font-bold text-lg">{previewDesign.name}</span>
                <Button
                  onClick={() => {
                    onDesignChange(previewDesign.name);
                    setPreviewDesign(null);
                  }}
                  className="bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl"
                >
                  {selectedDesign === previewDesign.name ? '✓ נבחר' : 'בחירת עיצוב'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {options?.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-3">התאמה אישית</h3>
          <div className="space-y-4">
            {options.map((option, index) => (
              <div key={index}>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  {option.label} {option.required && <span className="text-red-500">*</span>}
                </Label>

                {option.type === 'text' && (
                  <Input
                    placeholder={`הזינו ${option.label}`}
                    value={values[option.label] || ''}
                    onChange={(e) => onChange({ ...values, [option.label]: e.target.value })}
                    className="rounded-xl h-11"
                  />
                )}

                {option.type === 'names_list' && (
                  <NamesListField
                    label={option.label}
                    value={values[option.label] || ''}
                    onChange={(nextValue) => onChange({ ...values, [option.label]: nextValue })}
                  />
                )}

                {option.type === 'select' && (
                  <Select
                    value={values[option.label] || ''}
                    onValueChange={(nextValue) => onChange({ ...values, [option.label]: nextValue })}
                  >
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder={`בחרו ${option.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {option.options?.map(optionValue => (
                        <SelectItem key={optionValue} value={optionValue}>{optionValue}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {option.type === 'color' && (
                  <div className="flex flex-wrap gap-2">
                    {(option.options || Object.keys(colorOptions)).map(colorName => {
                      const hex = colorOptions[colorName] || colorName;
                      const isSelected = values[option.label] === colorName;
                      return (
                        <button
                          key={colorName}
                          type="button"
                          onClick={() => onChange({ ...values, [option.label]: colorName })}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            isSelected ? 'border-gray-900 scale-110 shadow-lg' : 'border-gray-200 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={colorName}
                        />
                      );
                    })}
                  </div>
                )}

                {option.type === 'image' && (
                  <ImageUploadField
                    label={option.label}
                    value={values[option.label] || []}
                    onChange={(nextValue) => onChange({ ...values, [option.label]: nextValue })}
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
