import { useEffect, useState } from "react";
import emailjs from "emailjs-com";
import styles from "../styles";
import TrainSearch from "./TrainSearch";
import MultiSelect from "../components/MultiSelect";

const TrainChecker = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [findData, setFindData] = useState<any>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [startSearch, setStartSearch] = useState<any>();
  const [routesContent, setRoutesContent] = useState<any>();
  const [trainNumber, setTrainNumber] = useState<any>();
  const [emailList, setEmailList] = useState<any>();
  const [name, setName] = useState<any>();
  const [bodyList, setBodyList] = useState<any>();
  const [isRefresh, setIsRefresh] = useState<boolean>(false);
  const [optionsList, setOptionsList] = useState<any>();
  const [selectedStations, setSelectedStations] = useState<any>([]);
  const [isClose, setIsClose] = useState<any>();

  const getData = async (body: any, name: any) => {
    const response = await fetch(
      "http://localhost:7777/proxy?url=https://web-api-prod-ytp.tcddtasimacilik.gov.tr/tms/train/train-availability?environment=dev&userId=1",
      {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "tr",
          "Content-Type": "application/json",
        },
        body: body,
      },
    );
    return { data: await response.json(), name: name };
  };

  const resultFunc = async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await Promise.all(
        bodyList.map((x: any) => getData(x.body, x?.name)),
      );
      setResultData(results);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("API Hatası:", err);
      setError(err.message || "Bilinmeyen hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startSearch) {
      let cancelled = false;

      const loop = async () => {
        while (!cancelled) {
          await resultFunc();
          await new Promise((r) => setTimeout(r, 5000));
        }
      };

      loop();

      setBodyList(bodyList);

      return () => {
        cancelled = true;
      };
    }
  }, [startSearch, isRefresh]);

  const sendMail = async (data: any, email: any, isSend: boolean) => {
    if (!isSend) return;

    try {
      await fetch("http://localhost:7777/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, data }),
      });
      console.log("mail gönderildi");
    } catch (err) {
      console.error("Mail gönderme hatası:", err);
    }
  };

  useEffect(() => {
    if (!resultData) return;

    const tempData: any[] = [];

    resultData?.forEach((x: any, index: number) => {
      x?.data?.trainLegs?.[0]?.trainAvailabilities?.forEach((e: any) => {
        const train = e?.trains?.[0];
        if (
          bodyList[index]?.train?.find((g: any) => g === String(train?.number))
        ) {
          const user = bodyList?.find((f: any) =>
            f?.train?.find((k: any) => String(k) === String(train?.number)),
          );
          const cabins = train?.cabinClassAvailabilities?.filter(
            (x: any) =>
              x?.cabinClass?.code === "Y1" || x?.cabinClass?.code === "C",
          );
          if (cabins?.length) {
            const tempData2 = bodyList?.map((d: any) =>
              d?.train?.find((k: any) => k === String(train?.number))
                ? { ...d, isSendEmail: false }
                : d,
            );
            sendMail(
              "Tren Bulundu - " + user?.name,
              user?.email,
              isClose?.find((e: any) => e?.name === user?.name)?.sendMail,
            );
            setBodyList(tempData2);
            const audio = new Audio("alert2.mp3");
            console.log("buldu", new Date());
            audio.play().catch(() => {
              console.log("Tarayıcı otomatik çalmaya izin vermedi");
            });
            tempData.push({ train: train, data: cabins, name: x?.name });
            setIsClose(
              isClose?.map((e: any) =>
                e?.name === user?.name ? { ...e, sendMail: false } : e,
              ),
            );
          } else {
            setIsClose(
              isClose?.map((e: any) =>
                e?.name === user?.name ? { ...e, sendMail: true } : e,
              ),
            );
          }
        }
      });
    });
    setFindData(tempData);
  }, [resultData]);

  const addList = () => {
    const tempData = {
      name: name,
      isSendEmail: true,
      train: selectedStations.map((part: any) => part.id),
      email: emailList.split(",").map((part: any) => part.trim()),
      body: JSON.stringify(routesContent),
    };
    if (!isClose) {
      setIsClose([{ name: name, sendMail: true }]);
    } else {
      setIsClose([...isClose, { name: name, sendMail: true }]);
    }
    if (bodyList) {
      setBodyList([...bodyList, tempData]);
    } else {
      setBodyList([tempData]);
    }
  };

  const removeList = (name: any) => {
    const tempData = bodyList?.filter((x: any) => x?.name !== name);
    if (tempData?.length > 0) {
      setBodyList(tempData);
      setIsRefresh(!isRefresh);
      setIsClose(isClose?.filter((e: any) => e?.name !== name));
    } else {
      setBodyList(null);
      setStartSearch(false);
      setIsRefresh(!isRefresh);
      setIsClose(null);
    }
  };

  return (
    <div
      style={{
        ...styles.container,
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <TrainSearch
        setOptions={setOptionsList}
        setRoutesContent={setRoutesContent}
        setSelectedStations={setSelectedStations}
        setName={setName}
      />

      {optionsList && (
        <div
          style={{
            background: "#1e1e1e",
            padding: "30px",
            borderRadius: "12px",
            border: "1px solid #333",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <h2
            style={{
              ...styles.header,
              borderBottom: "none",
              marginBottom: "25px",
              fontSize: "24px",
              color: "#03DAC6",
            }}
          >
            🔍 Otomatik Takip Oluştur
          </h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              alignItems: "flex-end",
              marginBottom: "30px",
            }}
          >
            {/* İsim */}
            <div style={{ flex: "1 1 200px" }}>
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
                Takip Adı
              </label>
              <input
                type="text"
                placeholder="Örn: Hafta Sonu Gezisi"
                value={name}
                onChange={(e: any) => setName(e?.target.value)}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "8px",
                  border: "1px solid #444",
                  backgroundColor: "#2a2a2a",
                  color: "#fff",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* İstasyonlar */}
            <div style={{ flex: "2 1 300px" }}>
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
                Trenleri Seç
              </label>
              <MultiSelect
                options={optionsList || []}
                selectedValues={selectedStations}
                onChange={setSelectedStations}
                placeholder="İzlenecek trenleri seçin..."
                displayKey="name"
                valueKey="id"
              />
            </div>

            {/* Email */}
            <div style={{ flex: "2 1 250px" }}>
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
                Bildirim E-postaları
              </label>
              <input
                type="text"
                placeholder="virgülle ayırın (mail1@test.com, ...)"
                value={emailList}
                onChange={(e: any) => setEmailList(e?.target.value)}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "8px",
                  border: "1px solid #444",
                  backgroundColor: "#2a2a2a",
                  color: "#fff",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div
              style={{ display: "flex", justifyContent: "end", width: "100%" }}
            >
              {/* Takip Et Butonu */}
              <button
                onClick={() => {
                  if (routesContent && selectedStations.length > 0 && name) {
                    setStartSearch(true);
                    setIsRefresh(!isRefresh);
                    addList();
                  }
                }}
                style={{
                  flex: "0 1 150px",
                  padding: "14px 25px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#03DAC6",
                  color: "#000",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 14px rgba(3, 218, 198, 0.2)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#05f0d9")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#03DAC6")
                }
              >
                Takibi Başlat
              </button>
            </div>
          </div>

          {/* Aktif Takipler Listesi */}
          {bodyList && bodyList.length > 0 && (
            <div style={{ marginBottom: "30px" }}>
              <label
                style={{
                  display: "block",
                  color: "#888",
                  marginBottom: "12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                }}
              >
                Aktif İzlenenler
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {bodyList?.map((e: any, key: any) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#2a2a2a",
                      padding: "8px 15px",
                      borderRadius: "20px",
                      border: "1px solid #444",
                      color: "#BB86FC",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ marginRight: "10px" }}>{e?.name}</span>
                    <span
                      style={{
                        color: "#CF6679",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "18px",
                        lineHeight: "1",
                      }}
                      onClick={() => removeList(e?.name)}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Arama Durumu */}
          {startSearch && (
            <div
              style={{
                padding: "15px",
                borderRadius: "8px",
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                {loading && (
                  <div
                    className="spinner"
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "2px solid #03DAC6",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                )}
                <span
                  style={{
                    color: loading ? "#FDD835" : "#03DAC6",
                    fontWeight: "500",
                  }}
                >
                  {loading ? "Sorgulanıyor..." : "Otomatik kontrol aktif"}
                </span>
              </div>
              {lastUpdated && (
                <span style={{ color: "#666", fontSize: "13px" }}>
                  Son Kontrol:{" "}
                  <strong>{lastUpdated.toLocaleTimeString()}</strong>
                </span>
              )}
            </div>
          )}

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* Sonuçlar */}
          <div style={{ marginTop: "20px" }}>
            {startSearch && findData && findData.length > 0 ? (
              findData?.map((x: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    ...styles.dataContainer,
                    border: "1px solid #333",
                    background: "#1a1a1a",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <h2
                      style={{ margin: 0, color: "#BB86FC", fontSize: "20px" }}
                    >
                      {x?.name}
                    </h2>
                    <span
                      style={{
                        padding: "4px 12px",
                        background: "#333",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: "#888",
                      }}
                    >
                      Tren No: {x?.train?.number}
                    </span>
                  </div>

                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th
                          style={{
                            ...styles.tableHeaderCell,
                            borderBottomColor: "#333",
                            color: "#888",
                          }}
                        >
                          Kabin Tipi
                        </th>
                        <th
                          style={{
                            ...styles.tableHeaderCell,
                            borderBottomColor: "#333",
                            color: "#888",
                            textAlign: "right",
                          }}
                        >
                          Durum
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {x.data?.map((e: any, index: number) => (
                        <tr
                          key={index}
                          style={{ borderBottom: "1px solid #222" }}
                        >
                          <td
                            style={{
                              ...styles.tableCell,
                              padding: "15px 12px",
                              color: "#ccc",
                            }}
                          >
                            {e?.cabinClass?.name} ({e?.cabinClass?.code})
                          </td>
                          <td
                            style={{
                              ...styles.tableCell,
                              padding: "15px 12px",
                              textAlign: "right",
                            }}
                          >
                            <span
                              style={{
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontWeight: "bold",
                                fontSize: "14px",
                                backgroundColor:
                                  e?.availabilityCount > 0
                                    ? "rgba(130, 233, 130, 0.1)"
                                    : "rgba(240, 128, 128, 0.1)",
                                color:
                                  e?.availabilityCount > 0
                                    ? "#82e982"
                                    : "#f08080",
                              }}
                            >
                              {e?.availabilityCount > 0
                                ? `${e.availabilityCount} Koltuk`
                                : "Dolu"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            ) : startSearch && !loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#666",
                  background: "#1a1a1a",
                  borderRadius: "8px",
                  border: "1px dashed #333",
                }}
              >
                Uygun koltuk bulunamadı, sistem kontrol etmeye devam ediyor...
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainChecker;
