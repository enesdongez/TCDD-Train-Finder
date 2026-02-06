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
    option[displayKey].toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggle = (option: any) => {
    const isSelected = selectedValues.some(
      (item) => item[valueKey] === option[valueKey],
    );

    if (isSelected) {
      onChange(
        selectedValues.filter((item) => item[valueKey] !== option[valueKey]),
      );
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const handleRemove = (option: any) => {
    onChange(
      selectedValues.filter((item) => item[valueKey] !== option[valueKey]),
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
          width: "350px",
          height: "45px",
          overflow: "auto",
          padding: "8px 12px",
          border: "1px solid #444",
          borderRadius: "8px",
          backgroundColor: "#2a2a2a",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#666")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#444")}
      >
        {selectedValues.length === 0 ? (
          <span style={{ color: "#777", fontSize: "14px" }}>{placeholder}</span>
        ) : (
          selectedValues.map((item) => (
            <span
              key={item[valueKey]}
              style={{
                backgroundColor: "#3d3d3d",
                color: "#BB86FC",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid #555",
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
                  color: "#CF6679",
                  cursor: "pointer",
                  padding: "0",
                  fontSize: "18px",
                  lineHeight: "1",
                  display: "flex",
                  alignItems: "center",
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
            marginTop: "8px",
            backgroundColor: "#252525",
            border: "1px solid #444",
            borderRadius: "8px",
            zIndex: 1000,
            maxHeight: "350px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          }}
        >
          {/* Search Input */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="İstasyon veya tren ara..."
            style={{
              padding: "12px 16px",
              border: "none",
              borderBottom: "1px solid #333",
              backgroundColor: "#2a2a2a",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Options List */}
          <div style={{ overflowY: "auto", maxHeight: "300px" }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option[valueKey]}
                  onClick={() => handleToggle(option)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid #333",
                    color: isSelected(option) ? "#BB86FC" : "#ccc",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    backgroundColor: isSelected(option)
                      ? "#2d2d2d"
                      : "transparent",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected(option)) {
                      e.currentTarget.style.backgroundColor = "#333";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected(option)) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "4px",
                      border: "2px solid",
                      borderColor: isSelected(option) ? "#BB86FC" : "#555",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isSelected(option)
                        ? "#BB86FC"
                        : "transparent",
                      transition: "all 0.2s",
                    }}
                  >
                    {isSelected(option) && (
                      <span
                        style={{
                          color: "#000",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "14px" }}>{option[displayKey]}</span>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: "20px",
                  color: "#666",
                  textAlign: "center",
                  fontSize: "14px",
                }}
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
