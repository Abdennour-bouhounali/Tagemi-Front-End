import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState } from "react";

const BirthdayInput = ({ value, onChange }) => {
  const selectedDate = value ? new Date(value) : null;

  return (
    <DatePicker
      selected={selectedDate}
      onChange={(date) => onChange(date.toISOString().split("T")[0])} // YYYY-MM-DD
      dateFormat="yyyy-MM-dd"
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      placeholderText="تاريخ الميلاد"
      className="p-2 h-10 border rounded w-full"
      maxDate={new Date()}
    />
  );
};

export default BirthdayInput;
