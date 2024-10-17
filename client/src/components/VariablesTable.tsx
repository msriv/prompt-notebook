import React from "react";
import { Table, TextField } from "@radix-ui/themes";

interface Variable {
  name: string;
  value: string;
}

interface VariablesTableProps {
  variables: { [key: string]: string };
  onUpdate: (name: string, value: string) => void;
}

interface VariableRowProps extends Variable {
  onUpdate: (name: string, value: string) => void;
}

const VariableRow: React.FC<VariableRowProps> = ({ name, value, onUpdate }) => {
  return (
    <Table.Row>
      <Table.Cell>{name}</Table.Cell>
      <Table.Cell>
        <TextField.Root
          value={value}
          onChange={(e) => onUpdate(name, e.target.value)}
        />
      </Table.Cell>
    </Table.Row>
  );
};

const VariablesTable: React.FC<VariablesTableProps> = ({
  variables,
  onUpdate,
}) => {
  return (
    <Table.Root variant="surface" className="overflow-hidden">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Variable</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Value</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body className="overflow-auto">
        {Object.entries(variables).map(([name, value]) => (
          <VariableRow
            key={name}
            name={name}
            value={value}
            onUpdate={onUpdate}
          />
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default VariablesTable;
