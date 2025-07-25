// script.js

// === Genel Değişkenler ve DOM Elementleri ===
const drivers = []; // Tüm şoför verilerini tutacak ana dizi
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
const addDriverBtn = document.getElementById('add-driver-btn');
const taskForm = document.getElementById('task-form');
const taskDestinationInput = document.getElementById('task-destination');
const assignmentResultDiv = document.getElementById('assignment-result');

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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

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
 * Yeni bir şoför ekleme işlevi.
 */
function addDriver() {
    let driverName = prompt("Şoförün adını girin:");
    if (!driverName) return;

    let pickupId = prompt("Pick-up numarasını/plakasını girin:");
    if (!pickupId) return;

    // Şoför adı veya plaka zaten var mı kontrol et
    if (drivers.some(d => d.name.toLowerCase() === driverName.trim().toLowerCase() || d.pickupId.toLowerCase() === pickupId.trim().toLowerCase())) {
        alert("Bu şoför adı veya plaka zaten mevcut!");
        return;
    }

    const newDriver = {
        id: Date.now().toString(), // Benzersiz ID
        name: driverName.trim(),
        pickupId: pickupId.trim(),
        taskHistory: [] // Görev geçmişi
    };

    drivers.push(newDriver);
    saveDataToLocalStorage(DRIVERS_STORAGE_KEY, drivers);
    renderDrivers(); // Listeyi güncelle
    alert(`${newDriver.name} şoförü ve ${newDriver.pickupId} pick-up'ı eklendi.`);
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

// === Görev Atama Mantığı ===

/**
 * En uygun şoförü seçmek için algoritma.
 * Son 30 gün içindeki toplam kat edilen mesafeyi dikkate alır.
 * En az mesafe kat eden şoförü tercih eder.
 * Ayrıca, Bekliyor veya Yolda durumu olan şoförleri de göz önünde bulundurur.
 * @param {number} currentTaskDistance - Atanacak görevin mesafesi (km).
 * @returns {Object|null} Atanacak en uygun şoför nesnesi veya bulunamazsa null.
 */
function findBestDriverForTask(currentTaskDistance) {
    if (drivers.length === 0) {
        return null;
    }

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    let bestDriver = null;
    let minDistanceInLast30Days = Infinity;

    // Sadece Bekliyor veya Yolda görevi olmayan şoförleri filtrele
    const availableDrivers = drivers.filter(driver =>
        !driver.taskHistory.some(task =>
            task.status === TASK_STATUSES.PENDING || task.status === TASK_STATUSES.ON_THE_WAY
        )
    );

    // Eğer aktif görevi olmayan şoförler varsa onları değerlendir, yoksa tüm şoförlere bak
    let driversToEvaluate = availableDrivers.length > 0 ? availableDrivers : drivers;

    driversToEvaluate.forEach(driver => {
        let totalDistanceLast30Days = 0;

        if (driver.taskHistory) {
            driver.taskHistory.forEach(task => {
                const taskDate = new Date(task.date);
                // Sadece TAMAMLANMIŞ görevlerin kilometresini hesaba kat
                if (taskDate >= thirtyDaysAgo && taskDate <= today && task.status === TASK_STATUSES.COMPLETED) {
                    totalDistanceLast30Days += task.distance;
                }
            });
        }

        if (totalDistanceLast30Days < minDistanceInLast30Days) {
            minDistanceInLast30Days = totalDistanceLast30Days;
            bestDriver = driver;
        }
    });

    return bestDriver;
}

/**
 * Yeni görev atamasını yapar.
 * @param {Event} smacked - Form submit olayı.
 */
function assignNewTask(event) {
    event.preventDefault(); // Sayfanın yeniden yüklenmesini engelle

    const destinationInput = taskDestinationInput.value.trim();
    const matchedLocationKey = Object.keys(predefinedTaskLocations).find(key =>
        key.toLowerCase() === destinationInput.toLowerCase()
    );

    let destinationToAssign = destinationInput;
    let distanceToAssign;

    if (matchedLocationKey === "Diğer") {
        distanceToAssign = parseInt(taskDistanceManualInput.value, 10);
        if (isNaN(distanceToAssign) || distanceToAssign < 0) {
            alert("Lütfen 'Diğer' görev yeri için geçerli bir mesafe girin.");
            return;
        }
        destinationToAssign = destinationInput;

    } else if (matchedLocationKey) {
        distanceToAssign = predefinedTaskLocations[matchedLocationKey];
        destinationToAssign = matchedLocationKey;
    } else {
        alert(`Girilen görev yeri ("${destinationInput}") tanımlı değil. Lütfen listeden bir yer girin veya 'Diğer' seçeneğini kullanarak mesafeyi manuel girin: \n\n${Object.keys(predefinedTaskLocations).join(', ')}`);
        return;
    }

    const taskType = distanceToAssign >= 100 ? 'uzak' : 'yakın';
    const assignedDriver = findBestDriverForTask(distanceToAssign);

    if (assignedDriver) {
        assignedDriver.taskHistory.push({
            id: Date.now().toString(), // Görevler için benzersiz ID
            destination: destinationToAssign,
            distance: distanceToAssign,
            type: taskType,
            date: new Date().toISOString().split('T')[0],
            status: TASK_STATUSES.PENDING
        });

        saveDataToLocalStorage(DRIVERS_STORAGE_KEY, drivers);
        renderDrivers();
        assignmentResultDiv.innerHTML = `
            <p><strong>Görev Atandı:</strong> ${destinationToAssign} (${distanceToAssign} km - ${taskType})</p>
            <p><strong>Atanan Şoför:</strong> ${assignedDriver.name} (${assignedDriver.pickupId})</p>
            <p>Şoförün güncel görev geçmişi güncellendi. En az mesafe kat eden şoför otomatik seçildi.</p>
        `;
        renderTaskHistory(); // Görev geçmişini ve durum tablolarını güncelle, bu da raporları güncelleyecek
    } else {
        assignmentResultDiv.innerHTML = '<p>Şoför bulunamadı veya atanacak müsait şoför yok. Lütfen en az bir şoför eklediğinizden emin olun.</p>';
    }

    taskDestinationInput.value = '';
    taskDistanceManualInput.value = '';
    manualDistanceGroup.style.display = 'none';
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
        updatedTaskType = updatedDistance >= 100 ? 'uzak' : 'yakın';
    } else if (newMatchedLocationKey) {
        updatedDistance = predefinedTaskLocations[newMatchedLocationKey];
        updatedTaskType = updatedDistance >= 100 ? 'uzak' : 'yakın';
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
    // --- Hata Ayıklama Eklentisi: updateTaskStatus çağrıldığında yeni durumu konsola yazdır ---
    console.log(`DEBUG: updateTaskStatus çağrıldı. Görev ID: ${taskId}, Yeni Durum: "${newStatus}"`);
    console.log(`DEBUG: Görev nesnesindeki güncel durum: "${task.status}"`);
    // --- Hata Ayıklama Eklentisi Sonu ---
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
        // --- Hata Ayıklama Eklentisi: renderTaskHistory her görevi işlerken durumunu konsola yazdır ---
        console.log(`DEBUG: renderTaskHistory - Görev ID: ${task.id}, İşlenen Durum: "${task.status}"`);
        // --- Hata Ayıklama Eklentisi Sonu ---

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
                // Tanımsız bir durum gelirse varsayılan olarak bekleyenlere ekle
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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const driverData = drivers.map(driver => {
        let totalDistance = 0;
        if (driver.taskHistory) {
            driver.taskHistory.forEach(task => {
                const taskDate = new Date(task.date);
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
                    
                });
            }
        });
        drivers.push(...storedDrivers);
    }

    renderDrivers(); // Şoförleri ekranda göster
    renderTaskHistory(); // Geçmiş görevleri göster (bu da tüm raporları güncelleyecek)
    populateLocationDatalist(); // Lokasyon önerilerini datalist'e doldur

    // Şoför ekleme butonuna tıklama olayı
    addDriverBtn.addEventListener('click', addDriver);

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
    
// Eski görevleri temizle butonuna tıklama olayı
    const cleanOldTasksBtn = document.getElementById('clean-old-tasks-btn');
    if (cleanOldTasksBtn) {
        cleanOldTasksBtn.addEventListener('click', cleanOldTasks);
    }
});
