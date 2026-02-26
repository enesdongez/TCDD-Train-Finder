import { useEffect, useState, useRef } from "react";
import axios from "axios";
import styles from "../styles";

interface Props {
  setOptions: any;
  setRoutesContent: any;
  setSelectedStations: any;
  setName: any;
}
const TrainSearch = (props: Props) => {
  const [trainSelectList, setTrainSelectList] = useState<any>(null);
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [filteredToStations, setFilteredToStations] = useState<any[]>([]);

  const [fromSearchTerm, setFromSearchTerm] = useState("");
  const [toSearchTerm, setToSearchTerm] = useState("");
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  const [findTrainList, setFindTrainList] = useState<any>();
  const [selectedStations, setSelectedStations] = useState<any>([]);

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trainSelectList) {
      axios
        .get("http://localhost:7777/proxy", {
          params: {
            url: "https://cdn-api-prod-ytp.tcddtasimacilik.gov.tr/datas/station-pairs-INTERNET.json?environment=dev&userId=1",
          },
          headers: {
            Accept: "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "tr",
            "Content-Type": "application/json",
          },
        })
        .then((res: any) => {
          setTrainSelectList(res?.data);
        })
        .catch((error) => {
          console.error("Error fetching train list:", error);
        });
    }
  }, [trainSelectList]);

  useEffect(() => {
    if (fromStation && trainSelectList) {
      const filtered = trainSelectList.filter(
        (station: any) => station.id !== fromStation,
      );
      setFilteredToStations(filtered);
      setToStation("");
      setToSearchTerm("");
    } else {
      setFilteredToStations(trainSelectList || []);
    }
  }, [fromStation, trainSelectList]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(event.target as Node)) {
        setShowFromDropdown(false);
      }
      if (toRef.current && !toRef.current.contains(event.target as Node)) {
        setShowToDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (dateString: any) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1); // 1 gün öncesi

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year} 21:00:00`;
  };

  const editDate = (tempDate: any) => {
    const date = new Date(tempDate);

    date.setHours(date.getHours() + 3);

    const result = date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return result;
  };

  const handleSearch = () => {
    const from = trainSelectList?.find((e: any) => e?.id === fromStation);
    const to = trainSelectList?.find((e: any) => e?.id === toStation);
    const date = formatDate(travelDate);
    props?.setRoutesContent({
      searchRoutes: [
        {
          departureStationId: from?.id,
          departureStationName: from?.name,
          arrivalStationId: to?.id,
          arrivalStationName: to?.name,
          departureDate: date,
        },
      ],
      passengerTypeCounts: [{ id: 0, count: 1 }],
      searchReservation: false,
      searchType: "DOMESTIC",
      blTrainTypes: ["TURISTIK_TREN"],
    });
    axios
      .post(
        "http://localhost:7777/proxy?url=https://web-api-prod-ytp.tcddtasimacilik.gov.tr/tms/train/train-availability?environment=dev&userId=1",
        {
          searchRoutes: [
            {
              departureStationId: from?.id,
              departureStationName: from?.name,
              arrivalStationId: to?.id,
              arrivalStationName: to?.name,
              departureDate: date,
            },
          ],
          passengerTypeCounts: [{ id: 0, count: 1 }],
          searchReservation: false,
          searchType: "DOMESTIC",
          blTrainTypes: ["TURISTIK_TREN"],
        },
        {
          headers: {
            Accept: "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "tr",
            "Content-Type": "application/json",
          },
        },
      )
      .then((res: any) => {
        const tempList: any = [];
        res.data?.trainLegs[0]?.trainAvailabilities?.forEach((x: any) => {
          const train = x?.trains[0];
          tempList.push({
            id: train?.number,
            name:
              editDate(train?.trainSegments[0]?.departureTime) +
              " - " +
              train?.name,
          });
        });
        props?.setOptions(tempList);
        props?.setSelectedStations([]);
        props?.setName("");
      })
      .catch((error) => {
        console.error("Error fetching train list:", error);
      });
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const turkishToLower = (text: string) => {
    return text
      .replace(/İ/g, "i")
      .replace(/I/g, "ı")
      .replace(/Ğ/g, "ğ")
      .replace(/Ü/g, "ü")
      .replace(/Ş/g, "ş")
      .replace(/Ö/g, "ö")
      .replace(/Ç/g, "ç")
      .toLowerCase();
  };

  const getFilteredFromStations = () => {
    if (!trainSelectList) return [];
    return trainSelectList.filter((station: any) =>
      turkishToLower(station.name).includes(turkishToLower(fromSearchTerm)),
    );
  };

  const getFilteredToStationsSearch = () => {
    if (!filteredToStations) return [];
    return filteredToStations.filter((station: any) =>
      turkishToLower(station.name).includes(turkishToLower(toSearchTerm)),
    );
  };

  const handleFromSelect = (station: any) => {
    setFromStation(station.id);
    setFromSearchTerm(station.name);
    setShowFromDropdown(false);
  };

  const handleToSelect = (station: any) => {
    setToStation(station.id);
    setToSearchTerm(station.name);
    setShowToDropdown(false);
  };

  const handleSwap = () => {
    const tempId = fromStation;
    const tempName = fromSearchTerm;
    setFromStation(toStation);
    setFromSearchTerm(toSearchTerm);
    setToStation(tempId);
    setToSearchTerm(tempName);
  };

  return (
    <div
      style={{
        width: "100%",
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        margin: "40px 0 60px 0",
        background: "#1e1e1e",
        padding: "30px",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        border: "1px solid #333",
      }}
    >
      <h2
        style={{
          ...styles.header,
          borderBottom: "none",
          marginBottom: "25px",
          fontSize: "24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span>🚆</span> Tren Seferlerini Bul
      </h2>

      <div
        style={{
          display: "flex",
          gap: "15px",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        {/* Nereden */}
        <div style={{ flex: "2 1 200px", position: "relative" }} ref={fromRef}>
          <label
            style={{
              display: "block",
              color: "#888",
              marginBottom: "8px",
              fontSize: "12px",
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            Nereden
          </label>
          <input
            type="text"
            value={fromSearchTerm}
            onChange={(e) => {
              setFromSearchTerm(e.target.value);
              setShowFromDropdown(true);
            }}
            onFocus={() => setShowFromDropdown(true)}
            placeholder="Kalkış İstasyonu"
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              fontSize: "15px",
              color: "#fff",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
              outline: "none",
            }}
          />
          {showFromDropdown && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                maxHeight: "300px",
                overflowY: "auto",
                backgroundColor: "#252525",
                border: "1px solid #444",
                borderRadius: "8px",
                marginTop: "8px",
                zIndex: 1000,
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              }}
            >
              {getFilteredFromStations()?.length > 0 ? (
                getFilteredFromStations().map((station: any) => (
                  <div
                    key={station.id}
                    onClick={() => handleFromSelect(station)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #333",
                      color: "#ccc",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#333")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    {station.name}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "16px",
                    color: "#777",
                    textAlign: "center",
                  }}
                >
                  Sonuç bulunamadı
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nereye */}
        <div style={{ flex: "2 1 200px", position: "relative" }} ref={toRef}>
          <label
            style={{
              display: "block",
              color: "#888",
              marginBottom: "8px",
              fontSize: "12px",
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            Nereye
          </label>
          <input
            type="text"
            value={toSearchTerm}
            onChange={(e) => {
              setToSearchTerm(e.target.value);
              setShowToDropdown(true);
            }}
            onFocus={() => setShowToDropdown(true)}
            disabled={!fromStation}
            placeholder="Varış İstasyonu"
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: fromStation ? "#2a2a2a" : "#1a1a1a",
              border: "1px solid #444",
              borderRadius: "8px",
              fontSize: "15px",
              color: fromStation ? "#fff" : "#555",
              cursor: fromStation ? "text" : "not-allowed",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
              outline: "none",
            }}
          />
          {showToDropdown && fromStation && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                maxHeight: "300px",
                backgroundColor: "#252525",
                overflowY: "auto",
                border: "1px solid #444",
                borderRadius: "8px",
                marginTop: "8px",
                zIndex: 1000,
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              }}
            >
              {getFilteredToStationsSearch()?.length > 0 ? (
                getFilteredToStationsSearch().map((station: any) => (
                  <div
                    key={station.id}
                    onClick={() => handleToSelect(station)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #333",
                      color: "#ccc",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#333")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    {station.name}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "16px",
                    color: "#777",
                    textAlign: "center",
                  }}
                >
                  Sonuç bulunamadı
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tarih */}
        <div style={{ flex: "1 1 150px" }}>
          <label
            style={{
              display: "block",
              color: "#888",
              marginBottom: "8px",
              fontSize: "12px",
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            Gidiş Tarihi
          </label>
          <input
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            min={getTodayDate()}
            style={{
              width: "100%",
              padding: "13px",
              backgroundColor: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              fontSize: "15px",
              color: "#fff",
              boxSizing: "border-box",
              outline: "none",
              colorScheme: "dark",
            }}
          />
        </div>

        {/* Ara Button */}
        <button
          onClick={handleSearch}
          style={{
            padding: "14px 40px",
            backgroundColor: "#BB86FC",
            color: "#000",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 4px 14px rgba(187, 134, 252, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#d1aaff";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#BB86FC";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Seferleri Getir
        </button>
      </div>
    </div>
  );
};

export default TrainSearch;
