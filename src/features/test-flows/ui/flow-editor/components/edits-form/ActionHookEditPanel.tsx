// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { ElementTokenOption } from "@features/test-flows/lib/flow-editor-token-options";
import { Field, Input, Select } from "@shared/ui";
import { TokenPickerInput } from "./TokenPickerInput";
import styles from "../../FlowEditor.module.scss";

type SelectOption = {
  value: string;
  label: string;
};

type ActionHookEditPanelProps = {
  actionSelector: ElementTokenOption | null;
  hookCommand: string;
  hookCommandOptions: SelectOption[];
  hookNeedsArgument: boolean;
  hookArgument: string;
  elementOptions: ElementTokenOption[];
  onActionSelectorChange: (value: ElementTokenOption | null) => void;
  onHookCommandChange: (value: string) => void;
  onHookArgumentChange: (value: string) => void;
};

export function ActionHookEditPanel({
  actionSelector,
  hookCommand,
  hookCommandOptions,
  hookNeedsArgument,
  hookArgument,
  elementOptions,
  onActionSelectorChange,
  onHookCommandChange,
  onHookArgumentChange,
}: ActionHookEditPanelProps) {
  return (
    <section className={styles.editsFormSection}>
      <Field label="Selector">
        <TokenPickerInput
          options={elementOptions}
          value={actionSelector}
          onChange={onActionSelectorChange}
          placeholder="Optional element"
          emptyLabel="No elements available"
        />
      </Field>
      <Field label="Command">
        <Select
          options={hookCommandOptions}
          value={hookCommand}
          onChange={(value) => onHookCommandChange(value ?? "wait")}
        />
      </Field>
      {hookNeedsArgument ? (
        <Field label="Arguments">
          <Input value={hookArgument} onChange={(event) => onHookArgumentChange(event.target.value)} />
        </Field>
      ) : null}
    </section>
  );
}
