import fs from 'fs';
let content = fs.readFileSync('src/components/FileManagementMenu.tsx', 'utf8');

// 1. Add `Server` to lucide-react imports
content = content.replace(/HardDrive\n\} from 'lucide-react';/, "HardDrive,\n  Server\n} from 'lucide-react';");

// 2. Add `SoftwareIntegrationsModal` import
content = content.replace(/import \{ LinkContactSettingsModal \} from '\.\/LinkContactSettingsModal';/, "import { LinkContactSettingsModal } from './LinkContactSettingsModal';\nimport { SoftwareIntegrationsModal } from './SoftwareIntegrationsModal';");

// 3. Update the type for `activeModal`
content = content.replace(/'new_project' \| 'save_as' \| 'export_team' \| 'search_linked' \| 'link_settings' \| null/, "'new_project' | 'save_as' | 'export_team' | 'search_linked' | 'link_settings' | 'software_integrations' | null");
content = content.replace(/modal: 'new_project' \| 'save_as' \| 'export_team' \| 'search_linked' \| 'link_settings' \| 'publish'/, "modal: 'new_project' | 'save_as' | 'export_team' | 'search_linked' | 'link_settings' | 'software_integrations' | 'publish'");

// 4. Add the menu item for Software Integrations
const softwareMenuItem = `
            {/* Software Integrations */}
            <div className="p-1 space-y-0.5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleSelectOption('software_integrations')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between group transition-colors text-slate-200 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Server className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold block text-[11px]">Software Integrations</span>
                    <span className="text-[9px] text-slate-400 block">Connect ERP, CRM & Accounting</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </button>
            </div>
`;

// Insert the new menu item before `{/* Menu Options Group 2: Publishing & Export */}`
content = content.replace(/\{\/\* Menu Options Group 2: Publishing & Export \*\/\}/, softwareMenuItem + '\n            {/* Menu Options Group 2: Publishing & Export */}');

// 5. Add the SoftwareIntegrationsModal component to the portal render block
const integrationModalBlock = `
          {activeModal === 'software_integrations' && (
            <SoftwareIntegrationsModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
            />
          )}
        </>,
        document.body
`;
content = content.replace(/<\/>,\s*document\.body/, integrationModalBlock);

fs.writeFileSync('src/components/FileManagementMenu.tsx', content);
console.log('Patched FileManagementMenu.tsx');
