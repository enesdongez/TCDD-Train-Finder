import { useEffect, useState } from "react";
import emailjs from "emailjs-com";
import styles from "../styles";

const TrainChecker = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [findData, setFindData] = useState<any>(null);
  const [resultData, setResultData] = useState<any>(null);
  //81023 , 81502  test
  //81007 , 81004  gerçek
  const [bodyList, setBodyList] = useState<any>([
    {
      name: "Zülal",
      isSendEmail: true,
      train: "81007",
      email: "zeynepzulal9@hotmail.com",
      // email: "enes.dongez@jforce.com",
      body: JSON.stringify({
        searchRoutes: [
          {
            departureStationId: 98,
            departureStationName: "ANKARA GAR",
            arrivalStationId: 93,
            arrivalStationName: "ESKİŞEHİR",
            departureDate: "31-10-2025 21:00:00",
          },
        ],
        passengerTypeCounts: [{ id: 0, count: 1 }],
        searchReservation: false,
        searchType: "DOMESTIC",
        blTrainTypes: ["TURISTIK_TREN"],
      }),
    },
    // {
    //   name: "Enes",
    //   isSendEmail: true,
    //   train: train2,
    //   email: "enes.dongez@jforce.com",
    //   body: JSON.stringify({
    //     searchRoutes: [
    //       {
    //         departureStationId: 1325,
    //         departureStationName: "İSTANBUL(SÖĞÜTLÜÇEŞME)",
    //         arrivalStationId: 93,
    //         arrivalStationName: "ESKİŞEHİR",
    //         departureDate: "31-10-2025 21:00:00",
    //       },
    //     ],
    //     passengerTypeCounts: [{ id: 0, count: 1 }],
    //     searchReservation: false,
    //     searchType: "DOMESTIC",
    //     blTrainTypes: ["TURISTIK_TREN"],
    //   }),
    // },
  ]);

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
      }
    );
    return { data: await response.json(), name: name };
  };

  const resultFunc = async () => {
    try {
      setLoading(true);
      setError(null);

      const results = await Promise.all(
        bodyList.map((x: any) => getData(x.body, x?.name))
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
      })
    );

    return () => {
      cancelled = true;
    };
  }, []);

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
        "lQSnSbW1ViMo7cq_W"
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
        if (String(train?.number) === bodyList[index]?.train) {
          const cabins = train?.cabinClassAvailabilities?.filter(
            (x: any) =>
              x?.cabinClass?.code === "Y1" || x?.cabinClass?.code === "C"
          );
          if (cabins?.length) {
            const user = bodyList?.find(
              (f: any) => f?.train === String(train?.number)
            );

            if (user?.isSendEmail === true) {
              const tempData = bodyList?.map((d: any) =>
                d.train === String(train?.number)
                  ? { ...d, isSendEmail: false }
                  : d
              );
              sendMail("Tren Bulundu", user?.email);
              sendMail("Tren Bulundu", "enes.dongez@jforce.com");
              setBodyList(tempData);
            } else {
              if (user?.isSendEmail === false) {
                setBodyList(
                  bodyList?.map((d: any) =>
                    d.train === String(train?.number)
                      ? { ...d, isSendEmail: new Date() }
                      : d
                  )
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

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>
        TCDD Tren Durum Kontrolü{" "}
        <span role="img" aria-label="train">
          🚆
        </span>
      </h2>
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

      {findData && findData.length > 0
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
                    <th style={styles.tableHeaderCell}>Müsait Koltuk Sayısı</th>
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
                            e?.availabilityCount > 0 ? "#82e982" : "#f08080",
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
        : "Veri Bulunamamıştır"}
    </div>
  );
};
export default TrainChecker;
