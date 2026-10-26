import React from "react";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import {
  EstablishmentRequestStatusFilter,
  EstablishmentRequestStatusFilterLabel,
} from "../enum/EstablishmentRequestStatusFilter";

interface Props {
  id?: string;
  name?: string;
  value: EstablishmentRequestStatusFilter;
  disabled?: boolean;
  onChange?: (status: EstablishmentRequestStatusFilter) => void;
}

export function EstablishmentRequestStatusFilterSelect({
  value,
  disabled = false,
  id,
  name,
  onChange,
}: Props) {
  const options = Object.entries(EstablishmentRequestStatusFilterLabel).map(
    ([val, label]) => ({ label, value: val as EstablishmentRequestStatusFilter })
  );

  return (
    <Dropdown
      id={id}
      name={name}
      disabled={disabled}
      value={value}
      options={options}
      onChange={(e: DropdownChangeEvent) => onChange?.(e.value)}
      className="w-full md:w-14rem"
    />
  );
}
