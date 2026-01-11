import { useEffect, useState, useRef } from "react";
import axios from "axios";
import styles from "../styles";
import MultiSelect from "../input/MultiSelect";
interface Props {
  setOptions: any;
  setRoutesContent: any;
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
        .get("https://train-finder-proxy.onrender.com/proxy", {
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
        (station: any) => station.id !== fromStation
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
        "https://train-finder-proxy.onrender.com/proxy?url=https://web-api-prod-ytp.tcddtasimacilik.gov.tr/tms/train/train-availability?environment=dev&userId=1",
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
        }
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
      turkishToLower(station.name).includes(turkishToLower(fromSearchTerm))
    );
  };

  const getFilteredToStationsSearch = () => {
    if (!filteredToStations) return [];
    return filteredToStations.filter((station: any) =>
      turkishToLower(station.name).includes(turkishToLower(toSearchTerm))
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
        fontFamily: "Arial, sans-serif",
        margin: "50px 0px 150px 0px",
      }}
    >
      <h2 style={styles.header}>TCDD Tren Seç 🚂</h2>

      <div
        style={{
          borderTop: "1px solid #333",
          paddingTop: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "15px",
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          {/* Nereden */}
          <div style={{ flex: "1 1 200px", position: "relative" }} ref={fromRef}>
            <input
              type="text"
              value={fromSearchTerm}
              onChange={(e) => {
                setFromSearchTerm(e.target.value);
                setShowFromDropdown(true);
              }}
              onFocus={() => setShowFromDropdown(true)}
              placeholder="Nereden"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #333",
                borderRadius: "4px",
                fontSize: "14px",
                cursor: "text",
                color: "#999",
                boxSizing: "border-box",
              }}
            />
            {showFromDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  maxHeight: "250px",
                  overflowY: "auto",
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  marginTop: "4px",
                  zIndex: 1000,
                }}
              >
                {getFilteredFromStations()?.length > 0 ? (
                  getFilteredFromStations().map((station: any) => (
                    <div
                      key={station.id}
                      onClick={() => handleFromSelect(station)}
                      style={{
                        padding: "12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #333",
                        color: "#999",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#252525")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#1a1a1a")
                      }
                    >
                      {station.name}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "12px", color: "#666" }}>
                    Sonuç bulunamadı
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nereye */}
          <div style={{ flex: "1 1 200px", position: "relative" }} ref={toRef}>
            <input
              type="text"
              value={toSearchTerm}
              onChange={(e) => {
                setToSearchTerm(e.target.value);
                setShowToDropdown(true);
              }}
              onFocus={() => setShowToDropdown(true)}
              disabled={!fromStation}
              placeholder="Nereye"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #333",
                borderRadius: "4px",
                fontSize: "14px",
                cursor: fromStation ? "text" : "not-allowed",
                color: "#999",
                opacity: fromStation ? 1 : 0.5,
                boxSizing: "border-box",
              }}
            />
            {showToDropdown && fromStation && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  maxHeight: "250px",
                  backgroundColor: "#1a1a1a",
                  overflowY: "auto",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  marginTop: "4px",
                  zIndex: 1000,
                }}
              >
                {getFilteredToStationsSearch()?.length > 0 ? (
                  getFilteredToStationsSearch().map((station: any) => (
                    <div
                      key={station.id}
                      onClick={() => handleToSelect(station)}
                      style={{
                        padding: "12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #333",
                        color: "#999",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#252525")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#1a1a1a")
                      }
                    >
                      {station.name}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "12px", color: "#666" }}>
                    Sonuç bulunamadı
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ flex: "1 1 200px", position: "relative" }}>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              min={getTodayDate()}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #333",
                borderRadius: "4px",
                fontSize: "14px",
                // backgroundColor: "#1a1a1a",
                color: "#999",
                boxSizing: "border-box",
                // colorScheme: "dark", // Date picker'ı dark mode yapar
              }}
            />
          </div>

          <button
            onClick={handleSearch}
            style={{
              padding: "12px 24px",
              color: "#999",
              border: "1px solid #333",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Ara
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainSearch;
