import { useEffect, useState } from "react";
import emailjs from "emailjs-com";
import styles from "../styles";
import TrainSearch from "./TrainSearch";
import MultiSelect from "../input/MultiSelect";

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

  const getData = async (body: any, name: any) => {
    const response = await fetch(
      "https://train-finder-proxy.onrender.com/proxy?url=https://web-api-prod-ytp.tcddtasimacilik.gov.tr/tms/train/train-availability?environment=dev&userId=1",
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

  const dataControl = (gDate: any) => {
    const diffMs = Math.abs((new Date() as any) - (new Date(gDate) as any));
    const diffMinutes = diffMs / 1000 / 60;

    if (diffMinutes >= 5) {
      return true;
    } else {
      return false;
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

      setBodyList(
        bodyList?.map((d: any) => {
          if (d?.isSendEmail !== true && d?.isSendEmail !== false) {
            if (dataControl(d?.isSendEmail)) {
              return { ...d, isSendEmail: true };
            } else {
              return d;
            }
          } else {
            return d;
          }
        }),
      );

      return () => {
        cancelled = true;
      };
    }
  }, [startSearch, isRefresh]);

  const sendMail = (data: any, email: any) => {
    emailjs
      .send(
        "service_8hv2vlt",
        "template_2q3wlyi",
        {
          to_email: email,
          from_name: "Tren Bulucu",
          subject: "Tren Bulundu",
          message_html: data,
        },
        "lQSnSbW1ViMo7cq_W",
      )
      .then(() => {
        console.log("mail gönderildi");
      })
      .catch((err) => console.error("Mail gönderme hatası:", err));
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
          const cabins = train?.cabinClassAvailabilities?.filter(
            (x: any) =>
              x?.cabinClass?.code === "Y1" || x?.cabinClass?.code === "C",
          );
          if (cabins?.length) {
            const user = bodyList?.find((f: any) =>
              f?.train?.find((k: any) => String(k) === String(train?.number)),
            );
            if (user?.isSendEmail === true) {
              const tempData = bodyList?.map((d: any) =>
                d?.train?.find((k: any) => k === String(train?.number))
                  ? { ...d, isSendEmail: false }
                  : d,
              );
              sendMail("Tren Bulundu", user?.email);
              setBodyList(tempData);
            } else {
              if (user?.isSendEmail === false) {
                setBodyList(
                  bodyList?.map((d: any) =>
                    d?.train?.find((k: any) => k === String(train?.number))
                      ? { ...d, isSendEmail: new Date() }
                      : d,
                  ),
                );
              }
            }

            const audio = new Audio("alert2.mp3");
            console.log("buldu", new Date());
            audio.play().catch(() => {
              console.log("Tarayıcı otomatik çalmaya izin vermedi");
            });
            tempData.push({ train: train, data: cabins, name: x?.name });
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
    } else {
      setBodyList(null);
      setStartSearch(false);
      setIsRefresh(!isRefresh);
    }
  };

  return (
    <div style={styles.container}>
      <div>
        <TrainSearch
          setOptions={setOptionsList}
          setRoutesContent={setRoutesContent}
        />
      </div>
      {optionsList && (
        <>
          <h2 style={styles.header}>
            TCDD Tren Durum Kontrolü{" "}
            <span role="img" aria-label="train">
              🚆
            </span>
          </h2>
          {startSearch && (
            <div style={styles.statusInfo}>
              {loading && <p style={styles.loadingText}>Veri yükleniyor...</p>}
              {error && <p style={styles.errorText}>Hata: {error}</p>}
              {lastUpdated && !loading && (
                <p style={styles.updatedText}>
                  Son Güncelleme:{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                </p>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap", // Küçük ekranlarda alt alta geçer
              gap: "12px",
              margin: "30px auto", // Ortalamak için auto ekledik
              maxWidth: "1200px", // Formun çok fazla yayılmasını engeller
              justifyContent: "center",
              alignItems: "stretch", // Tüm elemanların boyu eşit olur
              padding: "0 15px", // Kenarlardan taşmayı önler
            }}
          >
            {/* İsim Inputu */}
            <input
              type="text"
              placeholder="İsim"
              value={name}
              onChange={(e: any) => setName(e?.target.value)}
              style={{
                flex: "1 1 200px", // En az 200px yer kapla, sığmazsa aşağı geç
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #333",
                backgroundColor: "#1a1a1a",
                color: "#fff",
                outline: "none",
              }}
            />

            {/* İstasyon Seçimi - MultiSelect kapsayıcısı */}
            {optionsList && (
              <div style={{ flex: "2 1 300px", minWidth: "250px" }}>
                <MultiSelect
                  options={optionsList || []}
                  selectedValues={selectedStations}
                  onChange={setSelectedStations}
                  placeholder="İstasyon seçiniz..."
                  displayKey="name"
                  valueKey="id"
                  // Not: MultiSelect bileşeninin kendi iç stillerinde genişliği %100 yapmalısın
                />
              </div>
            )}

            {/* Email Listesi Inputu */}
            <input
              type="text"
              placeholder="Email listesi (virgülle ayırın).."
              value={emailList}
              onChange={(e: any) => setEmailList(e?.target.value)}
              style={{
                flex: "1 1 250px",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #333",
                backgroundColor: "#1a1a1a",
                color: "#fff",
                outline: "none",
              }}
            />

            {/* Ara Butonu */}
            <input
              type="button"
              value="Ara"
              onClick={() => {
                if (routesContent && selectedStations && name) {
                  setStartSearch(true);
                  setIsRefresh(!isRefresh);
                  addList();
                }
              }}
              style={{
                flex: "0 1 120px", // Buton çok büyümesin
                minWidth: "100px",
                padding: "12px 20px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#007bff", // Standart mavi buton rengi
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background 0.3s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#0056b3")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#007bff")
              }
            />
          </div>

          {bodyList && (
            <div
              style={{
                display: "flex",
                borderBottom: "2px solid #373737",
                borderTop: "2px solid #373737",
                padding: 10,
              }}
            >
              {bodyList?.map((e: any, key: any) => {
                return (
                  <div>
                    <b
                      style={{
                        color: "red",
                        marginRight: 4,
                        marginLeft: key === 0 ? 4 : 30,
                        cursor: "pointer",
                      }}
                      onClick={() => removeList(e?.name)}
                    >
                      X
                    </b>
                    {e?.name}
                  </div>
                );
              })}{" "}
            </div>
          )}

          {startSearch && findData && findData.length > 0
            ? findData?.map((x: any) => (
                <div style={styles.dataContainer}>
                  <h1>{x?.name}</h1>
                  <h3 style={styles.dataHeader}>
                    {x?.train?.number + " - "} Sefer Numarası Müsaitlik
                  </h3>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableRow}>
                        <th style={styles.tableHeaderCell}>Kabin Bölümü</th>
                        <th style={styles.tableHeaderCell}>
                          Müsait Koltuk Sayısı
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {x.data?.map((e: any, index: number) => (
                        <tr
                          key={index}
                          style={{
                            ...styles.tableRow,
                            background: index % 2 === 0 ? "#2a2a2a" : "#1e1e1e",
                          }}
                        >
                          <td style={styles.tableCell}>
                            {e?.cabinClass?.name || "N/A"} (
                            {e?.cabinClass?.code || ""})
                          </td>
                          <td
                            style={{
                              ...styles.tableCell,
                              color:
                                e?.availabilityCount > 0
                                  ? "#82e982"
                                  : "#f08080",
                              fontWeight: "bold",
                            }}
                          >
                            {e?.availabilityCount !== undefined
                              ? e?.availabilityCount
                              : "Kontrol Edilemiyor"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            : startSearch && (
                <div style={{ marginTop: 35 }}>Veri Bulunamamıştır</div>
              )}
        </>
      )}
    </div>
  );
};
export default TrainChecker;
