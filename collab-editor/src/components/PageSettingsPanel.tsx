import { PageSettings } from './PageEditor';
import Button from './atomic/Button';

interface PageSettingsPanelProps {
  settings: PageSettings;
  onSettingsChange: (newSettings: PageSettings) => void;
  defaultSettings: PageSettings;
  isVisible: boolean;
}

export default function PageSettingsPanel({
  settings,
  onSettingsChange,
  defaultSettings,
  isVisible,
}: PageSettingsPanelProps) {
  // Function to update a single setting
  const updateSetting = (key: keyof PageSettings, value: number) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  if (!isVisible) return null;

  return (
    <div className="mb-6 p-4 bg-gray-100 rounded-md">
      <h3 className="text-md font-semibold mb-3">Page Settings</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Page Width */}
        <div>
          <label className="block text-sm mb-1">
            Page Width: {settings.pageWidth}px
          </label>
          <input
            type="range"
            min="500"
            max="1200"
            step="10"
            value={settings.pageWidth}
            onChange={(e) =>
              updateSetting("pageWidth", parseInt(e.target.value))
            }
            className="w-full"
          />
        </div>

        {/* Page Height */}
        <div>
          <label className="block text-sm mb-1">
            Page Height: {settings.pageHeight}px
          </label>
          <input
            type="range"
            min="600"
            max="1200"
            step="10"
            value={settings.pageHeight}
            onChange={(e) =>
              updateSetting("pageHeight", parseInt(e.target.value))
            }
            className="w-full"
          />
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-sm mb-1">
            Font Size: {settings.fontSize}px
          </label>
          <input
            type="range"
            min="12"
            max="24"
            step="1"
            value={settings.fontSize}
            onChange={(e) =>
              updateSetting("fontSize", parseInt(e.target.value))
            }
            className="w-full"
          />
        </div>

        {/* Line Height */}
        <div>
          <label className="block text-sm mb-1">
            Line Height: {settings.lineHeight}
          </label>
          <input
            type="range"
            min="1"
            max="2.5"
            step="0.1"
            value={settings.lineHeight}
            onChange={(e) =>
              updateSetting("lineHeight", parseFloat(e.target.value))
            }
            className="w-full"
          />
        </div>

        {/* Buffer Height */}
        <div>
          <label className="block text-sm mb-1">
            Split Buffer: {settings.bufferHeight}px
          </label>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={settings.bufferHeight}
            onChange={(e) =>
              updateSetting("bufferHeight", parseInt(e.target.value))
            }
            className="w-full"
          />
        </div>

        {/* Preset Buttons - replaced with Button component */}
        <div className="col-span-2 flex gap-2 mt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSettingsChange(defaultSettings)}
          >
            Default
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onSettingsChange({
                ...defaultSettings,
                pageWidth: 595,
                pageHeight: 842,
              })
            }
          >
            A4
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onSettingsChange({
                ...defaultSettings,
                pageWidth: 612,
                pageHeight: 792,
              })
            }
          >
            Letter
          </Button>
        </div>
      </div>
    </div>
  );
}