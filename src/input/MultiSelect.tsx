import { useState, useRef, useEffect } from "react";

interface MultiSelectProps {
  options: any[];
  selectedValues: any[];
  onChange: (selected: any[]) => void;
  placeholder?: string;
  displayKey?: string;
  valueKey?: string;
}

const MultiSelect = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Seçiniz...",
  displayKey = "name",
  valueKey = "id",
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option[displayKey].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (option: any) => {
    const isSelected = selectedValues.some(
      (item) => item[valueKey] === option[valueKey]
    );

    if (isSelected) {
      onChange(
        selectedValues.filter((item) => item[valueKey] !== option[valueKey])
      );
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const handleRemove = (option: any) => {
    onChange(
      selectedValues.filter((item) => item[valueKey] !== option[valueKey])
    );
  };

  const isSelected = (option: any) => {
    return selectedValues.some((item) => item[valueKey] === option[valueKey]);
  };

  return (
    <div style={{ position: "relative", width: "100%" }} ref={containerRef}>
      {/* Selected Items Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          minHeight: "44px",
          padding: "8px 12px",
          border: "1px solid white",
          borderRadius: "4px",
           backgroundColor: "white",
          color: "#999",
          cursor: "pointer",
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        {selectedValues.length === 0 ? (
          <span style={{ color: "#666" }}>{placeholder}</span>
        ) : (
          selectedValues.map((item) => (
            <span
              key={item[valueKey]}
              style={{
                backgroundColor: "#000000ff",
                color: "white",
                padding: "9px 8px",
                borderRadius: "4px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {item[displayKey]}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  padding: "0",
                  fontSize: "16px",
                  lineHeight: "1",
                }}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
             backgroundColor: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "4px",
            zIndex: 1000,
            maxHeight: "300px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search Input */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ara..."
            style={{
              padding: "10px 12px",
              border: "none",
              borderBottom: "1px solid #333",
               backgroundColor: "#1a1a1a",
              color: "#999",
              fontSize: "14px",
              outline: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Options List */}
          <div style={{ overflowY: "auto", maxHeight: "250px" }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option[valueKey]}
                  onClick={() => handleToggle(option)}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #333",
                    color: "#999",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    // backgroundColor: isSelected(option) ? "#252525" : "#1a1a1a",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected(option)) {
                      e.currentTarget.style.backgroundColor = "#252525";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected(option)) {
                      e.currentTarget.style.backgroundColor = "#1a1a1a";
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected(option)}
                    readOnly
                    style={{
                      cursor: "pointer",
                      accentColor: "#666",
                    }}
                  />
                  {option[displayKey]}
                </div>
              ))
            ) : (
              <div
                style={{ padding: "12px", color: "#666", textAlign: "center" }}
              >
                Sonuç bulunamadı
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
