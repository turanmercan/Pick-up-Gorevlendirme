// script.js

// === Genel Değişkenler ve DOM Elementleri ===
// Başlangıç şoför verileri buraya eklendi.
const drivers = [
    { id: '101', name: 'Abdullah AVCI', pickupId: '06 CGV 233', taskHistory: [] },
    { id: '102', name: 'Halil ÜREGEN', pickupId: '06 DMZ 696', taskHistory: [] },
    { id: '103', name: 'İbrahim ATAR', pickupId: '06 CJB 815', taskHistory: [] },
    { id: '104', name: 'İbrahim YILMAZ', pickupId: '06 CGU 771', taskHistory: [] },
    { id: '105', name: 'Mehmet KÖYLÜ', pickupId: '06 CGU 847', taskHistory: [] },
    { id: '106', name: 'Murat AVCI', pickupId: '06 CGU 856', taskHistory: [] },
    { id: '107', name: 'Uğur Can ARAR', pickupId: '06 CGU 488', taskHistory: [] },
    { id: '108', name: 'Yakup ÖZTÜRK', pickupId: '06 CGU 954', taskHistory: [] },
    { id: '109', name: 'Zeki AKSU-Abdülbari ÖĞUREL', pickupId: '06 CFP 257', taskHistory: [] }
    // İhtiyacınıza göre buraya daha fazla şoför ekleyebilirsiniz.
    // Her bir şoför nesnesinin 'id' (benzersiz bir numara/string), 'name', 'pickupId'
    // ve 'taskHistory' (boş bir dizi olarak) içerdiğinden emin olun.
];
const DRIVERS_STORAGE_KEY = 'pickupDrivers'; // localStorage için anahtar

// Önceden tanımlanmış görev yerleri ve mesafeleri - ALFABETİK OLARAK SIRALANMIŞ HALİ
const predefinedTaskLocations = {
    "Adana Merkez": 10,
    "Antakya": 190,
    "Arsuz": 170,
    "Ceyhan": 50,
    "Defne": 200,
    "Diğer": 0, // Manuel mesafe girişi için özel seçenek
    "Dörtyol": 100,
    "Erzin": 90,
    "Feke": 130,
    "Hassa": 200,
    "İskenderun": 130,
    "Kadirli": 100,
    "Karaisalı": 55,
    "Karataş": 50,
    "Kırıkhan": 160,
    "Kozan": 85,
    "Mersin": 85,
    "Osmaniye": 95,
    "Payas": 110,
    "Pozantı": 100,
    "Reyhanlı": 205,
    "Sarıçam": 20,
    "Tarsus": 50,
    "Yayladağı": 235,
    "Yumurtalık": 70
};

// HTML elementlerini seçiyoruz
const driversListDiv = document.getElementById('drivers-list');
const taskForm = document.getElementById('task-form');
const taskDestinationInput = document.getElementById('task-destination');
const assignmentResultDiv = document.getElementById('assignment-result');
// Yeni eklenen şoför seçimi elementleri
const driverSelect = document.getElementById('driver-select'); // YENİ
const clearDriverSelectionBtn = document.getElementById('clear-driver-selection-btn'); // YENİ

// Görev listesi DOM elementlerini doğrudan seçiyoruz
const pendingTasksList = document.querySelector('#pending-tasks .task-list');
const onTheWayTasksList = document.querySelector('#on-the-way-tasks .task-list');
const completedTasksList = document.querySelector('#completed-tasks .task-list');
const canceledTasksList = document.querySelector('#canceled-tasks .task-list');

// Manuel mesafe girişi için DOM elementleri
const manualDistanceGroup = document.getElementById('manual-distance-group');
const taskDistanceManualInput = document.getElementById('task-distance-manual');

// Datalist için referans
const predefinedLocationsDatalist = document.getElementById('predefined-locations');

// Görev durumları için sabit tanımlar
const TASK_STATUSES = {
    PENDING: 'Bekliyor',
    ON_THE_WAY: 'Yolda',
    COMPLETED: 'Tamamlandı',
    CANCELED: 'İptal Edildi'
};

// === Yardımcı Fonksiyonlar ===

/**
 * Verileri localStorage'a kaydeder.
 * @param {string} key - Kaydedilecek verinin anahtarı.
 * @param {Array<Object>} data - Kaydedilecek veri dizisi.
 */
function saveDataToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Veri localStorage'a kaydedilirken hata oluştu:", e);
        alert("Tarayıcınızda yerel depolama alanı kullanılamıyor veya dolu. Veriler kaydedilemeyebilir.");
    }
}

/**
 * localStorage'dan verileri yükler.
 * @param {string} key - Yüklenecek verinin anahtarı.
 * @returns {Array<Object>} Yüklenen veri dizisi veya boş dizi.
 */
function loadDataFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Veri localStorage'dan yüklenirken hata oluştu:", e);
        return [];
    }
}

// === Şoför Yönetimi ===

/**
 * Şoförleri ve pick-up'larını başlangıçta veya localStorage'dan yüklendikten sonra gösterir.
 */
function renderDrivers() {
    driversListDiv.innerHTML = ''; // Listeyi temizle

    if (drivers.length === 0) {
        driversListDiv.innerHTML = '<p>Henüz şoför eklenmedi. "Şoför Ekle" butonuna tıklayın.</p>';
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Bugünün başlangıcı
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0); // 30 gün öncenin başlangıcı

    // Şoförleri ekranda listele
    drivers.forEach(driver => {
        const driverCard = document.createElement('div');
        driverCard.className = 'driver-card'; // CSS için sınıf

        let historyText = 'Henüz görev almadı.';
        if (driver.taskHistory && driver.taskHistory.length > 0) {
            // Sadece tamamlanmış görevlerin km'sini göster
            const lastCompletedTasks = driver.taskHistory.filter(task => task.status === TASK_STATUSES.COMPLETED).slice(-3);
            const formattedTasks = lastCompletedTasks.map(task => `${task.distance} km (${task.type})`).join(', ');
            historyText = lastCompletedTasks.length > 0 ? `Son tamamlanan görevler: ${formattedTasks}` : 'Henüz tamamlanmış görevi yok.';
        }

        // Son 30 gün toplam km hesaplama (sadece tamamlanmış görevler)
        let totalDistanceLast30Days = 0;
        if (driver.taskHistory) {
            driver.taskHistory.forEach(task => {
                const taskDate = new Date(task.date);
                taskDate.setHours(0, 0, 0, 0); // Görev tarihinin başlangıcı
                if (taskDate >= thirtyDaysAgo && taskDate <= today && task.status === TASK_STATUSES.COMPLETED) {
                    totalDistanceLast30Days += task.distance;
                }
            });
        }

        driverCard.innerHTML = `
            <h3>${driver.name}</h3>
            <p><strong>Pick-up:</strong> ${driver.pickupId}</p>
            <p><strong>Geçmiş:</strong> ${historyText}</p>
            <p><strong>Son 30 Gün Toplam Km:</strong> ${totalDistanceLast30Days} km</p>
        `;
        driversListDiv.appendChild(driverCard);
    });
}

/**
 * Şoförü listeden ve localStorage'dan siler.
 * @param {string} driverId - Silinecek şoförün ID'si.
 */
function removeDriver(driverId) {
    if (!confirm("Bu şoförü silmek istediğinizden emin misiniz?")) {
        return;
    }
    const initialLength = drivers.length;
    for (let i = 0; i < drivers.length; i++) {
        if (drivers[i].id === driverId) {
            drivers.splice(i, 1);
            break;
        }
    }
    if (drivers.length < initialLength) {
        saveDataToLocalStorage(DRIVERS_STORAGE_KEY, drivers);
        renderDrivers(); // Listeyi güncelle
        renderTaskHistory(); // Şoförün görevleri de silindiği için geçmişi de güncelle
        alert("Şoför başarıyla silindi.");
    } else {
        alert("Şoför bulunamadı.");
    }
}

/**
 * Şoförleri seçim kutusuna doldurur.
 */
function populateDriverSelect() {
    driverSelect.innerHTML = '<option value="">Otomatik Seç (En Uygun)</option>'; // Varsayılan seçeneği koru
    drivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.id;
        option.textContent = driver.name;
        driverSelect.appendChild(option);
    });
}


// === Görev Atama Mantığı ===

/**
 * En uygun şoförü seçmek için algoritma.
 * Son 30 gün içindeki toplam kat edilen mesafeyi ve son görev tipini dikkate alır.
 * En az mesafe kat eden şoförü tercih ederken, eğer atanacak görev yakın mesafe ise
 * bir gün önce uzak mesafe görevi yapmış şoförlere öncelik verir.
 * Ayrıca, yakın görevler için aynı şoföre üst üste yakın görev atanmasını mümkünse önlemeye çalışır.
 * Uzak görevlerde ise kilometreleri yakın şoförlerden son görevi yakın olanı tercih eder.
 *
 * @param {number} currentTaskDistance - Atanacak görevin mesafesi (km).
 * @param {string} currentTaskType - Atanacak görevin tipi ('yakın' veya 'uzak').
 * @returns {Object|null} Atanacak en uygun şoför nesnesi veya bulunamazsa null.
 */
function findBestDriverForTask(currentTaskDistance, currentTaskType) {
    if (drivers.length === 0) {
        return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Bugünün başlangıcı
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1); // Dünün başlangıcı

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0); // 30 gün öncenin başlangıcı

    // Sadece Bekliyor veya Yolda görevi olmayan şoförleri filtrele
    let availableDrivers = drivers.filter(driver =>
        !driver.taskHistory.some(task =>
            task.status === TASK_STATUSES.PENDING || task.status === TASK_STATUSES.ON_THE_WAY
        )
    );

    if (availableDrivers.length === 0) {
        return null; // Müsait şoför yok
    }

    // Her şoför için son 30 gün toplam mesafesini ve son görev bilgisini hesapla
    const driverScores = availableDrivers.map(driver => {
        let totalDistanceLast30Days = 0;
        let lastCompletedTask = null;
        let lastCompletedTaskDate = null;
        let lastCompletedTaskType = null;

        if (driver.taskHistory) {
            // Sadece tamamlanmış görevleri al ve en yeniden eskiye sırala
            const completedTasks = driver.taskHistory.filter(task => task.status === TASK_STATUSES.COMPLETED);
            completedTasks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (completedTasks.length > 0) {
                lastCompletedTask = completedTasks[0];
                lastCompletedTaskDate = new Date(lastCompletedTask.date);
                lastCompletedTaskDate.setHours(0, 0, 0, 0); // Tarih karşılaştırması için sadece günü al
                lastCompletedTaskType = lastCompletedTask.type;
            }

            // Son 30 gün toplam kilometreyi hesapla
            driver.taskHistory.forEach(task => {
                const taskDate = new Date(task.date);
                taskDate.setHours(0, 0, 0, 0); // Görev tarihinin başlangıcı
                if (taskDate >= thirtyDaysAgo && taskDate <= today && task.status === TASK_STATUSES.COMPLETED) {
                    totalDistanceLast30Days += task.distance;
                }
            });
        }

        return {
            driver: driver,
            totalDistanceLast30Days: totalDistanceLast30Days,
            lastCompletedTask: lastCompletedTask,
            lastCompletedTaskDate: lastCompletedTaskDate,
            lastCompletedTaskType: lastCompletedTaskType
        };
    });

    let bestDriver = null;

    if (currentTaskType === 'yakın') {
        // Yeni kural: Aynı şoföre üst üste yakın görev atanmasını mümkünse önle.
        // Öncelik sıralaması:
        // 1. Dün uzak görev yapmış şoförler.
        // 2. Kilometreleri yakın ve son görevi uzak olanlar.
        // 3. Son tamamlanan görevi bugün yakın olmayanlar (1 ve 2. önceliktekiler hariç).
        // 4. Son tamamlanan görevi bugün yakın olanlar (son çare).

        // Müsait şoförler arasındaki minimum toplam kilometreyi bul
        const minDistanceOverall = driverScores.length > 0
            ? Math.min(...driverScores.map(score => score.totalDistanceLast30Days))
            : 0;

        // **1. Öncelik: Dün uzak görev yapmış şoförler**
        const yesterdayFarDrivers = driverScores.filter(score => {
            return score.lastCompletedTask &&
                   score.lastCompletedTaskType === 'uzak' &&
                   score.lastCompletedTaskDate &&
                   score.lastCompletedTaskDate.getTime() === yesterday.getTime();
        }).sort((a, b) => a.totalDistanceLast30Days - b.totalDistanceLast30Days); // En az km yapana öncelik

        if (yesterdayFarDrivers.length > 0) {
            bestDriver = yesterdayFarDrivers[0].driver;
        } else {
            // **2. Öncelik: Kilometreleri yakın (0-100 km fark) ve son görevi uzak olan şoförler**
            const closeKmAndLastFarDrivers = driverScores.filter(score => {
                const isCloseKm = score.totalDistanceLast30Days <= (minDistanceOverall + 100);
                const isLastTaskFar = score.lastCompletedTaskType === 'uzak';
                return isCloseKm && isLastTaskFar;
            }).sort((a, b) => a.totalDistanceLast30Days - b.totalDistanceLast30Days); // En az km yapana öncelik

            if (closeKmAndLastFarDrivers.length > 0) {
                bestDriver = closeKmAndLastFarDrivers[0].driver;
            } else {
                // **3. Öncelik: Son görevi bugün yakın olmayan şoförler**
                const notLastTaskCloseAndToday = driverScores.filter(score => {
                    const isLastTaskCloseAndToday = score.lastCompletedTask &&
                                                    score.lastCompletedTaskType === 'yakın' &&
                                                    score.lastCompletedTaskDate &&
                                                    score.lastCompletedTaskDate.getTime() === today.getTime();
                    return !isLastTaskCloseAndToday; // Yani son görevi ya uzak ya da yakın ama bugün değil
                }).sort((a, b) => a.totalDistanceLast30Days - b.totalDistanceLast30Days); // En az km yapana öncelik

                if (notLastTaskCloseAndToday.length > 0) {
                    bestDriver = notLastTaskCloseAndToday[0].driver;
                } else {
                    // **4. Öncelik (Son Çare): Tüm şoförlerin son görevi bugün yakın ise**
                    // Genel olarak en az km yapmış olanı seç (burada başka seçenek kalmaz)
                    driverScores.sort((a, b) => a.totalDistanceLast30Days - b.totalDistanceLast30Days);
                    bestDriver = driverScores[0].driver;
                }
            }
        }
        return bestDriver;

    } else { // currentTaskType === 'uzak'
        // Uzak görevler için geliştirilmiş öncelik sıralaması:
        // 1. En düşük km'ye sahip şoförün 100km yakını içindeki şoförlerden, son görevi 'yakın' olanlar.
        // 2. Eğer 1. kritere uyan yoksa, genel olarak en az km yapmış şoför.

        // Müsait şoförler arasındaki minimum toplam kilometreyi bul
        const minDistanceOverall = driverScores.length > 0
            ? Math.min(...driverScores.map(score => score.totalDistanceLast30Days))
            : 0;

        // Şoförleri, ana öncelik sırasına göre sırala:
        // 1. Önce, son 30 gün toplam mesafesi genel minimumun 100km yakınında olan ve son görevi 'yakın' olanlar.
        // 2. Sonra, diğer şoförler (yani son görevi uzak olanlar veya kilometre farkı 100km'den fazla olanlar).
        driverScores.sort((a, b) => {
            const aIsLastCloseAndNearMinKm = a.lastCompletedTaskType === 'yakın' && a.totalDistanceLast30Days <= (minDistanceOverall + 100);
            const bIsLastCloseAndNearMinKm = b.lastCompletedTaskType === 'yakın' && b.totalDistanceLast30Days <= (minDistanceOverall + 100);

            // Eğer A, hem son görevi yakın hem de km'si düşük aralıktaysa ve B değilse, A önde.
            if (aIsLastCloseAndNearMinKm && !bIsLastCloseAndNearMinKm) {
                return -1;
            }
            // Eğer B, hem son görevi yakın hem de km'si düşük aralıktaysa ve A değilse, B önde.
            if (!aIsLastCloseAndNearMinKm && bIsLastCloseAndNearMinKm) {
                return 1;
            }

            // Eğer ikisi de aynı kategoriye giriyorsa (ikiside uygun veya ikiside uygun değil),
            // veya ikisi de son görevi yakın değilse/kilometre aralığında değilse,
            // sadece toplam kilometreye göre sırala (azdan çoğa).
            const kmDiff = a.totalDistanceLast30Days - b.totalDistanceLast30Days;
            if (kmDiff !== 0) {
                return kmDiff;
            }

            // Kilometreler eşitse, alfabetik olarak sırala (varsayılan tie-breaker)
            return a.driver.name.localeCompare(b.driver.name, 'tr', { sensitivity: 'base' });
        });
        
        bestDriver = driverScores[0].driver; 
        return bestDriver;
    }
}


/**
 * Yeni görev atamasını yapar.
 * @param {Event} event - Form submit olayı.
 */
function assignNewTask(event) {
    event.preventDefault(); // Sayfanın yeniden yüklenmesini engelle

    const destinationInput = taskDestinationInput.value.trim();
    const matchedLocationKey = Object.keys(predefinedTaskLocations).find(key =>
        key.toLowerCase() === destinationInput.toLowerCase()
    );

    let destinationToAssign = destinationInput;
    let distanceToAssign;
    let taskType; // Yeni: Görev tipi de belirlenecek

    if (matchedLocationKey === "Diğer") {
        distanceToAssign = parseInt(taskDistanceManualInput.value, 10);
        if (isNaN(distanceToAssign) || distanceToAssign < 0) {
            alert("Lütfen 'Diğer' görev yeri için geçerli bir mesafe girin.");
            return;
        }
        taskType = distanceToAssign >= 60 ? 'uzak' : 'yakın'; // Uzak algısı 60 km ve üzeri
    } else if (matchedLocationKey) {
        distanceToAssign = predefinedTaskLocations[matchedLocationKey];
        taskType = distanceToAssign >= 60 ? 'uzak' : 'yakın'; // Uzak algısı 60 km ve üzeri
        destinationToAssign = matchedLocationKey; // Eğer datalist'ten seçildiyse eşleşen key'i kullan
    } else {
        alert(`Girilen görev yeri ("${destinationInput}") tanımlı değil. Lütfen listeden bir yer girin veya 'Diğer' seçeneğini kullanarak mesafeyi manuel girin: \n\n${Object.keys(predefinedTaskLocations).join(', ')}`);
        return;
    }

    let assignedDriver = null;
    const selectedDriverId = driverSelect.value; // Seçilen şoförün ID'sini al

    if (selectedDriverId) {
        // Eğer bir şoför manuel olarak seçildiyse onu kullan
        assignedDriver = drivers.find(d => d.id === selectedDriverId);
        if (!assignedDriver) {
            alert("Seçilen şoför bulunamadı.");
            return;
        }
        // Manuel atama yapıldığında bile şoförün Bekliyor veya Yolda görevi olmamalı kontrolü
        const hasActiveTask = assignedDriver.taskHistory.some(task =>
            task.status === TASK_STATUSES.PENDING || task.status === TASK_STATUSES.ON_THE_WAY
        );
        if (hasActiveTask) {
            alert(`${assignedDriver.name} şoförünün zaten bekleyen veya yolda bir görevi var. Lütfen başka bir şoför seçin veya otomatik atamayı kullanın.`);
            return;
        }
    } else {
        // Şoför seçilmediyse otomatik olarak en uygun şoförü bul
        // taskType'ı da findBestDriverForTask'a gönderiyoruz
        assignedDriver = findBestDriverForTask(distanceToAssign, taskType);
    }

    if (assignedDriver) {
        assignedDriver.taskHistory.push({
            id: Date.now().toString(), // Görevler için benzersiz ID
            destination: destinationToAssign,
            distance: distanceToAssign,
            type: taskType, // Görev tipini de kaydet
            date: new Date().toISOString().split('T')[0],
            status: TASK_STATUSES.PENDING
        });

        saveDataToLocalStorage(DRIVERS_STORAGE_KEY, drivers);
        renderDrivers();
        assignmentResultDiv.innerHTML = `
            <p><strong>Görev Atandı:</strong> ${destinationToAssign} (${distanceToAssign} km - ${taskType})</p>
            <p><strong>Atanan Şoför:</strong> ${assignedDriver.name} (${assignedDriver.pickupId})</p>
            ${selectedDriverId ? '<p>Şoför manuel olarak seçildi.</p>' : '<p>En uygun şoför otomatik seçildi.</p>'}
            <p>Şoförün güncel görev geçmişi güncellendi.</p>
        `;
        renderTaskHistory(); // Görev geçmişini ve durum tablolarını güncelle, bu da raporları güncelleyecek
    } else {
        assignmentResultDiv.innerHTML = '<p>Şoför bulunamadı veya atanacak müsait şoför yok. Lütfen en az bir şoför eklediğinizden veya şoförlerin aktif görevleri olmadığından emin olun.</p>';
    }

    taskDestinationInput.value = '';
    taskDistanceManualInput.value = '';
    manualDistanceGroup.style.display = 'none';
    driverSelect.value = ''; // Seçimi sıfırla
}

// === Görev Geçmişi Yönetimi ===

/**
 * Belirli bir görevi düzenler.
 * @param {string} driverId - Görevin ait olduğu şoförün ID'si.
 * @param {string} taskId - Düzenlenecek görevin ID'si.
 */
function editTask(driverId, taskId) {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    const task = driver.taskHistory.find(t => t.id === taskId);
    if (!task) return;

    let newDestination = prompt(`Görevin yeni yerini girin (Mevcut: ${task.destination}). Listeden seçim yapabilir veya 'Diğer' yazıp mesafeyi manuel girebilirsiniz:`, task.destination);
    if (newDestination === null) return;

    newDestination = newDestination.trim();
    let updatedDistance;
    let updatedTaskType;

    const newMatchedLocationKey = Object.keys(predefinedTaskLocations).find(key => key.toLowerCase() === newDestination.toLowerCase());

    if (newMatchedLocationKey === "Diğer") {
        let manualDist = prompt(`'Diğer' seçeneği için yeni mesafeyi girin (km):`, task.distance);
        manualDist = parseInt(manualDist, 10);
        if (isNaN(manualDist) || manualDist < 0) {
            alert("Geçerli bir mesafe girmediniz.");
            return;
        }
        updatedDistance = manualDist;
        updatedTaskType = updatedDistance >= 60 ? 'uzak' : 'yakın'; // Uzak algısı 60 km ve üzeri
    } else if (newMatchedLocationKey) {
        updatedDistance = predefinedTaskLocations[newMatchedLocationKey];
        updatedTaskType = updatedDistance >= 60 ? 'uzak' : 'yakın'; // Uzak algısı 60 km ve üzeri
        newDestination = newMatchedLocationKey;
    } else {
        alert(`Geçerli bir görev yeri girmediniz veya girilen yer tanımlı değil. Tanımlı yerler: \n\n${Object.keys(predefinedTaskLocations).join(', ')}`);
        return;
    }

    task.destination = newDestination;
    task.distance = updatedDistance;
    task.type = updatedTaskType;

    saveDataToLocalStorage(DRIVERS_STORAGE_KEY, drivers);
    renderDrivers();
    renderTaskHistory(); // Görev geçmişini tekrar çiz (bu da raporları güncelleyecek)
    alert("Görev başarıyla güncellendi.");
}

/**
 * Belirli bir görevin durumunu günceller.
 * @param {string} driverId - Görevin ait olduğu şoförün ID'si.
 * @param {string} taskId - Durumu güncellenecek görevin ID'si.
 * @param {string} newStatus - Yeni durum değeri.
 */
function updateTaskStatus(driverId, taskId, newStatus) {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) {
        console.error("Şoför bulunamadı:", driverId);
        return;
    }

    const task = driver.taskHistory.find(t => t.id === taskId);
    if (!task) {
        console.error("Görev bulunamadı:", taskId);
        return;
    }

    task.status = newStatus;
    saveDataToLocalStorage(DRIVERS_STORAGE_KEY, drivers);
    renderDrivers();
    renderTaskHistory(); // Görev geçmişini tekrar çiz (bu da raporları güncelleyecek)
}


/**
 * Belirli bir görevi siler.
 * @param {string} driverId - Görevin ait olduğu şoförün ID'si.
 * @param {string} taskId - Silinecek görevin ID'si.
 */
function deleteTask(driverId, taskId) {
    if (!confirm("Bu görevi silmek istediğinizden emin misiniz?")) {
        return;
    }

    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    const initialLength = driver.taskHistory.length;
    driver.taskHistory = driver.taskHistory.filter(task => task.id !== taskId);

    if (driver.taskHistory.length < initialLength) {
        saveDataToLocalStorage(DRIVERS_STORAGE_KEY, drivers);
        renderDrivers();
        renderTaskHistory(); // Görev geçmişini tekrar çiz (bu da raporları güncelleyecek)
        alert("Görev başarıyla silindi.");
    } else {
        alert("Görev bulunamadı.");
    }
}


/**
 * Tüm görev geçmişini durumlarına göre ayrı sütunlarda gösterir.
 */
function renderTaskHistory() {
    // Tüm listeleri temizle
    pendingTasksList.innerHTML = '';
    onTheWayTasksList.innerHTML = '';
    completedTasksList.innerHTML = '';
    canceledTasksList.innerHTML = '';

    const allTasks = [];

    // Tüm şoförlerin görev geçmişlerini topla ve her göreve bir 'driverId' ekle
    drivers.forEach(driver => {
        if (driver.taskHistory) {
            driver.taskHistory.forEach(task => {
                allTasks.push({
                    driverId: driver.id,
                    driverName: driver.name,
                    pickupId: driver.pickupId,
                    ...task
                });
            });
        }
    });

    // Tarihe göre ters sırala (en yeniler üste gelsin)
    allTasks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (allTasks.length === 0) {
        // Eğer hiç görev yoksa, her sütuna boş mesaj ekle
        pendingTasksList.innerHTML = '<li class="no-task">Henüz bekleyen görev yok.</li>';
        onTheWayTasksList.innerHTML = '<li class="no-task">Henüz yolda görev yok.</li>';
        completedTasksList.innerHTML = '<li class="no-task">Henüz tamamlanan görev yok.</li>';
        canceledTasksList.innerHTML = '<li class="no-task">Henüz iptal edilen görev yok.</li>';
        // Görev yoksa, grafiklerin de boş görünmesi için çağrıları yap
        renderDriverKmChart();
        renderTaskStatusChart();
        renderTaskLocationDensityChart();
        return;
    }

    allTasks.forEach(task => {
        // Durum seçiciyi oluştur
        let statusOptionsHtml = '';
        for (const key in TASK_STATUSES) {
            const statusValue = TASK_STATUSES[key];
            statusOptionsHtml += `<option value="${statusValue}" ${task.status === statusValue ? 'selected' : ''}>${statusValue}</option>`;
        }

        const li = document.createElement('li');
        li.innerHTML = `
            ${task.date}: <strong>${task.driverName}</strong> (${task.pickupId})<br>
            ${task.destination} (${task.distance} km - ${task.type})<br>
            <select class="task-status-select" data-driver-id="${task.driverId}" data-task-id="${task.id}">
                ${statusOptionsHtml}
            </select><br>
            <div class="task-actions" data-driver-id="${task.driverId}" data-task-id="${task.id}" data-task-status="${task.status}">
            </div>
        `;

        const taskActionsDiv = li.querySelector('.task-actions');

        // Durumuna göre butonları ekle
        if (task.status === TASK_STATUSES.PENDING) {
            // Sadece silme butonu
            taskActionsDiv.innerHTML += `
                <button class="delete-task-btn" data-driver-id="${task.driverId}" data-task-id="${task.id}">Sil</button>
            `;
        } else if (task.status === TASK_STATUSES.ON_THE_WAY) {
            // Onaylama kutusu (Tamamlandı olarak işaretle) ve sil butonu
            taskActionsDiv.innerHTML += `
                <label class="complete-checkbox-label">
                    <input type="checkbox" class="complete-task-checkbox" data-driver-id="${task.driverId}" data-task-id="${task.id}"> Tamamlandı
                </label>
                <button class="delete-task-btn" data-driver-id="${task.driverId}" data-task-id="${task.id}">Sil</button>
            `;
        } else { // COMPLETED ve CANCELED için
            taskActionsDiv.innerHTML += `
                <button class="edit-task-btn" data-driver-id="${task.driverId}" data-task-id="${task.id}">Düzenle</button>
                <button class="delete-task-btn" data-driver-id="${task.driverId}" data-task-id="${task.id}">Sil</button>
            `;
        }

        // Görev durumuna göre ilgili listeye ekle
        switch (task.status) {
            case TASK_STATUSES.PENDING:
                pendingTasksList.appendChild(li);
                break;
            case TASK_STATUSES.ON_THE_WAY:
                onTheWayTasksList.appendChild(li);
                break;
            case TASK_STATUSES.COMPLETED:
                completedTasksList.appendChild(li);
                break;
            case TASK_STATUSES.CANCELED:
                canceledTasksList.appendChild(li);
                break;
            default:
                // Tanımsız bir durum gel olursa varsayılan olarak bekleyenlere ekle
                console.warn(`Bilinmeyen görev durumu: "${task.status}". Görev Bekleyenlere eklendi.`);
                pendingTasksList.appendChild(li);
        }
    });

    // Her sütunda görev yoksa "Henüz görev yok." mesajını göster
    if (pendingTasksList.children.length === 0) pendingTasksList.innerHTML = '<li class="no-task">Henüz bekleyen görev yok.</li>';
    if (onTheWayTasksList.children.length === 0) onTheWayTasksList.innerHTML = '<li class="no-task">Henüz yolda görev yok.</li>';
    if (completedTasksList.children.length === 0) completedTasksList.innerHTML = '<li class="no-task">Henüz tamamlanan görev yok.</li>';
    if (canceledTasksList.children.length === 0) canceledTasksList.innerHTML = '<li class="no-task">Henüz iptal edilen görev yok.</li>';

    // Yeni eklenen butonlara ve durum seçicilere olay dinleyicileri ekle
    // Not: Bu olay dinleyicileri her renderTaskHistory çağrıldığında yeniden eklenmeli,
    // çünkü DOM elementleri yeniden oluşturuluyor.
    document.querySelectorAll('.edit-task-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const driverId = event.target.dataset.driverId;
            const taskId = event.target.dataset.taskId;
            editTask(driverId, taskId);
        });
    });

    document.querySelectorAll('.delete-task-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const driverId = event.target.dataset.driverId;
            const taskId = event.target.dataset.taskId;
            deleteTask(driverId, taskId);
        });
    });

    // Durum seçicilere olay dinleyicisi ekle
    document.querySelectorAll('.task-status-select').forEach(selectElement => {
        selectElement.addEventListener('change', (event) => {
            const driverId = event.target.dataset.driverId;
            const taskId = event.target.dataset.taskId;
            const newStatus = event.target.value;
            updateTaskStatus(driverId, taskId, newStatus);
        });
    });

    // Tamamlama onay kutusu olay dinleyicisi ekle
    document.querySelectorAll('.complete-task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            if (event.target.checked) {
                const driverId = event.target.dataset.driverId;
                const taskId = event.target.dataset.taskId;
                updateTaskStatus(driverId, taskId, TASK_STATUSES.COMPLETED);
            }
        });
    });

    // Raporlama grafiklerini burada güncelle
    renderDriverKmChart();
    renderTaskStatusChart();
    renderTaskLocationDensityChart(); // Görev yeri yoğunluğu grafiğini de çağır
}

/**
 * predefinedTaskLocations objesindeki yerleri datalist'e doldurur.
 * "Diğer" seçeneğini de ekler.
 */
function populateLocationDatalist() {
    if (predefinedLocationsDatalist) {
        predefinedLocationsDatalist.innerHTML = ''; // Önceki seçenekleri temizle
        // Objenin anahtarlarını alıp alfabetik sıralayarak datalist'e ekle
        Object.keys(predefinedTaskLocations).sort((a, b) => a.localeCompare(b, 'tr', { sensitivity: 'base' })).forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            predefinedLocationsDatalist.appendChild(option);
        });
    }
}

// === Raporlama ve Görselleştirme Fonksiyonları ===

/**
 * Şoför başına son 30 gün içinde kat edilen toplam kilometreyi hesaplar ve grafik çizer.
 */
function renderDriverKmChart() {
    const ctx = document.getElementById('driverKmChart');
    if (!ctx) return; // Canvas elementi yoksa fonksiyonu durdur

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const driverData = drivers.map(driver => {
        let totalDistance = 0;
        if (driver.taskHistory) {
            driver.taskHistory.forEach(task => {
                const taskDate = new Date(task.date);
                taskDate.setHours(0, 0, 0, 0);
                if (taskDate >= thirtyDaysAgo && taskDate <= today && task.status === TASK_STATUSES.COMPLETED) {
                    totalDistance += task.distance;
                }
            });
        }
        return { name: driver.name, distance: totalDistance };
    }).sort((a, b) => b.distance - a.distance); // En çok km yapandan en aza doğru sırala

    // Sadece en çok km yapan ilk 10 şoförü al
    const topDrivers = driverData.slice(0, 10); // İlk 10 şoförü alırız

    const labels = topDrivers.map(d => d.name);
    const data = topDrivers.map(d => d.distance);

    // Mevcut grafiği yok et (eğer varsa), yeni grafik çizmeden önce
    if (window.driverKmChartInstance) {
        window.driverKmChartInstance.destroy();
    }

    window.driverKmChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Son 30 Gün Toplam Km',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Bu ayar, grafiğin HTML kapsayıcısının yüksekliğini almasını sağlar.
            indexAxis: 'y', // Çubukları yatay yapar, isimler daha rahat okunur
            scales: {
                x: { // x ekseni mesafe oldu
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Mesafe (Km)'
                    }
                },
                y: { // y ekseni şoför isimleri oldu
                    title: {
                        display: true,
                        text: 'Şoför Adı'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw} km`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Görev durumu dağılımını hesaplar ve pasta grafik çizer.
 */
function renderTaskStatusChart() {
    const ctx = document.getElementById('taskStatusChart');
    if (!ctx) return; // Canvas elementi yoksa fonksiyonu durdur

    const statusCounts = {
        [TASK_STATUSES.PENDING]: 0,
        [TASK_STATUSES.ON_THE_WAY]: 0,
        [TASK_STATUSES.COMPLETED]: 0,
        [TASK_STATUSES.CANCELED]: 0
    };

    drivers.forEach(driver => {
        if (driver.taskHistory) {
            driver.taskHistory.forEach(task => {
                if (statusCounts.hasOwnProperty(task.status)) {
                    statusCounts[task.status]++;
                } else {
                    // Bilinmeyen durumları da yakalamak için
                    console.warn(`Bilinmeyen görev durumu tespit edildi: ${task.status}`);
                }
            });
        }
    });

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    const backgroundColors = [
        'rgba(255, 159, 64, 0.6)', // Bekliyor (Turuncu)
        'rgba(54, 162, 235, 0.6)', // Yolda (Mavi)
        'rgba(75, 192, 192, 0.6)', // Tamamlandı (Yeşil)
        'rgba(255, 99, 132, 0.6)'  // İptal Edildi (Kırmızı)
    ];
    const borderColors = [
        'rgba(255, 159, 64, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)'
    ];

    // Mevcut grafiği yok et (eğer varsa), yeni grafik çizmeden önce
    if (window.taskStatusChartInstance) {
        window.taskStatusChartInstance.destroy();
    }

    window.taskStatusChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Görev yeri yoğunluğunu hesaplar ve pasta grafik olarak çizer.
 */
function renderTaskLocationDensityChart() {
    const ctx = document.getElementById('taskLocationDensityChart');
    if (!ctx) return; // Canvas elementi yoksa fonksiyonu durdur

    const locationCounts = {};

    drivers.forEach(driver => {
        if (driver.taskHistory) {
            driver.taskHistory.forEach(task => {
                const location = task.destination;
                locationCounts[location] = (locationCounts[location] || 0) + 1;
            });
        }
    });

    // En çok tekrar eden yerleri ilk 10 ile sınırlayalım veya tümünü gösterelim.
    const sortedLocations = Object.entries(locationCounts).sort(([, a], [, b]) => b - a);
    // İsteğe bağlı olarak ilk X lokasyonu sınırlayabiliriz: .slice(0, 10);

    const labels = sortedLocations.map(([location]) => location);
    const data = sortedLocations.map(([, count]) => count);

    // Dinamik renkler oluşturmak için
    const dynamicColors = function() {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        return `rgba(${r},${g},${b},0.6)`;
    };

    const backgroundColors = labels.map(() => dynamicColors());
    const borderColors = backgroundColors.map(color => color.replace('0.6', '1')); // Kenarlık için tam opaklık

    // Mevcut grafiği yok et (eğer varsa), yeni grafik çizmeden önce
    if (window.taskLocationDensityChartInstance) {
        window.taskLocationDensityChartInstance.destroy();
    }

    window.taskLocationDensityChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Görev Yeri Yoğunluğu'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed + ' görev';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}


// === Veri Yönetimi Fonksiyonları ===

    /**
     * Belirli bir tarihten eski, tamamlanmış veya iptal edilmiş görevleri temizler.
     */
    function cleanOldTasks() {
        const archiveDateInput = document.getElementById('archive-date');
        const selectedDateString = archiveDateInput.value;

        if (!selectedDateString) {
            alert("Lütfen temizleme için bir tarih seçin.");
            return;
        }

        const cleanUntilDate = new Date(selectedDateString);
        cleanUntilDate.setHours(0, 0, 0, 0); // Seçilen günün başlangıcını al

        if (!confirm(`Seçilen tarih olan ${selectedDateString} tarihinden önceki tüm 'Tamamlandı' ve 'İptal Edildi' görevleri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
            return;
        }

        let cleanedCount = 0;
        drivers.forEach(driver => {
            const initialTaskHistoryLength = driver.taskHistory.length;
            driver.taskHistory = driver.taskHistory.filter(task => {
                const taskDate = new Date(task.date);
                taskDate.setHours(0, 0, 0, 0); // Görev tarihinin başlangıcını al

                // Eğer görev tamamlanmış veya iptal edilmişse VE seçilen tarihten eskiyse sil
                if ((task.status === TASK_STATUSES.COMPLETED || task.status === TASK_STATUSES.CANCELED) && taskDate < cleanUntilDate) {
                    cleanedCount++;
                    return false; // Bu görevi filtrele, yani sil
                }
                return true; // Bu görevi tut
            });
            if (driver.taskHistory.length < initialTaskHistoryLength) {
                // Sadece şoförün geçmişi değiştiyse localStorage'a kaydet
                // Bu zaten genel saveData çağrısı ile hallediliyor, ama yine de not düşelim.
            }
        });

        saveDataToLocalStorage(DRIVERS_STORAGE_KEY, drivers); // Değişiklikleri kaydet
        renderDrivers(); // Şoför listesini güncelle
        renderTaskHistory(); // Görev geçmişini ve raporları güncelle

        alert(`${cleanedCount} adet eski görev başarıyla temizlendi.`);

        // Tarih seçiciyi varsayılan değere sıfırla (isteğe bağlı)
        archiveDateInput.value = '';
    }



    // === Olay Dinleyicileri ve Başlangıç Yüklemesi ===
    document.addEventListener('DOMContentLoaded', () => {   
        // Sayfa yüklendiğinde şoförleri localStorage'dan yükle
        const storedDrivers = loadDataFromLocalStorage(DRIVERS_STORAGE_KEY);
        if (storedDrivers.length > 0) {
            // Eğer localStorage'da veri varsa, başlangıçtaki drivers dizisini temizle
            // ve localStorage'daki verilerle doldur.
            drivers.splice(0, drivers.length);
            storedDrivers.forEach(driver => {
                if (driver.taskHistory) {
                    driver.taskHistory.forEach(task => {
                        if (!task.status) {
                            task.status = TASK_STATUSES.PENDING;
                        }
                        // Eğer görev ID'si yoksa otomatik ID ata
                        if (!task.id) {
                            task.id = Date.now().toString() + Math.random().toString(36).substring(2, 9); // Benzersiz bir ID oluştur
                        }
                        // Görev tipini de ekleyin, eski görevlerde olmayabilir
                        if (!task.type) {
                            task.type = task.distance >= 60 ? 'uzak' : 'yakın'; // Uzak algısı 60 km ve üzeri
                        }
                    });
                }
            });
            drivers.push(...storedDrivers);
        }

        renderDrivers(); // Şoförleri ekranda göster
        renderTaskHistory(); // Geçmiş görevleri göster (bu da tüm raporları güncelleyecek)
        populateLocationDatalist(); // Lokasyon önerilerini datalist'e doldur
        populateDriverSelect(); // YENİ: Şoför seçim kutusunu doldur
        
        // addDriverBtn kaldırıldığı için bu olay dinleyici kaldırıldı.
        // addDriverBtn.addEventListener('click', addDriver);

        // Görev atama formuna gönderme olayı
        taskForm.addEventListener('submit', assignNewTask);

        // Manuel mesafe grubu göster/gizle olayı
        taskDestinationInput.addEventListener('input', () => {
            const destinationValue = taskDestinationInput.value.trim().toLowerCase();
            if (destinationValue === "diğer") {
                manualDistanceGroup.style.display = 'block';
                taskDistanceManualInput.setAttribute('required', 'true');
            } else {
                manualDistanceGroup.style.display = 'none';
                taskDistanceManualInput.removeAttribute('required');
                taskDistanceManualInput.value = '';
            }
        });
        
        // Şoför seçimini iptal et butonuna tıklama olayı
        if (clearDriverSelectionBtn) { // Butonun varlığını kontrol et
            clearDriverSelectionBtn.addEventListener('click', () => {
                driverSelect.value = ''; // Seçimi sıfırla
                assignmentResultDiv.innerHTML = '<p>Şoför seçimi iptal edildi. Görev otomatik olarak en uygun şoföre atanacaktır.</p>';
            });
        }

        // Eski görevleri temizle butonuna tıklama olayı
        const cleanOldTasksBtn = document.getElementById('clean-old-tasks-btn');
        if (cleanOldTasksBtn) {
            cleanOldTasksBtn.addEventListener('click', cleanOldTasks);
        }
    });
