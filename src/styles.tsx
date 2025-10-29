
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: 30,
    fontFamily: "Roboto, 'Segoe UI', Arial, sans-serif",
    color: "#E0E0E0",
    background: "#121212",
    minHeight: "calc(100vh - 60px)",
  },
  header: {
    color: "#BB86FC",
    borderBottom: "2px solid #373737",
    paddingBottom: 10,
    marginBottom: 0,
  },
  divider: {
    borderColor: "#373737",
    margin: "20px 0",
  },
  statusInfo: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    padding: "10px 0",
    borderBottom: "1px solid #373737",
  },
  loadingText: {
    color: "#FDD835",
    fontStyle: "italic",
  },
  errorText: {
    color: "#CF6679",
    fontWeight: "bold",
  },
  updatedText: {
    fontSize: 14,
    color: "#A0A0A0",
  },
  dataContainer: {
    marginTop: 30,
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    padding: 20,
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
  },
  dataHeader: {
    color: "#03DAC6",
    marginBottom: 15,
    fontSize: 18,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  tableHeaderCell: {
    padding: 12,
    borderBottom: "2px solid #03DAC6",
    color: "#03DAC6",
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "uppercase",
  },
  tableRow: {
    transition: "background-color 0.2s",
  },
  tableCell: {
    padding: 12,
    borderBottom: "1px solid #373737",
    fontSize: 16,
  },
  preCode: {
    fontSize: 13,
    background: "#1E1E1E",
    padding: 15,
    borderRadius: 8,
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
};

export default styles;
