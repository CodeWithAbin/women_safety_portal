package com.womensafety.service;

import com.womensafety.config.TursoClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DemoDataSeederService {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeederService.class);

    public static final String DEMO_DOMAIN = "@demo.womensafety.internal";
    public static final String DEMO_PASSWORD_PLAIN = "DemoUser@123";
    public static final int TARGET_USERS_COUNT = 100;
    public static final int TARGET_REPORTS_COUNT = 200;
    public static final int REPORTS_PER_USER = 2;

    public static final int ACCEPTED_COUNT = 100;
    public static final int PENDING_COUNT = 60;
    public static final int RESOLVED_COUNT = 20;
    public static final int REJECTED_COUNT = 20;

    private final TursoClient tursoClient;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeederService(TursoClient tursoClient, PasswordEncoder passwordEncoder) {
        this.tursoClient = tursoClient;
        this.passwordEncoder = passwordEncoder;
    }

    // =========================================================================
    // Location Template Definition
    // =========================================================================
    private record ClusterLocation(
            String state,
            String district,
            double baseLat,
            double baseLon,
            String placeName,
            String address,
            String description,
            int initialRating
    ) {}

    private List<ClusterLocation> buildLocationTemplates() {
        List<ClusterLocation> templates = new ArrayList<>();

        // 1. Kerala - Ernakulam
        templates.add(new ClusterLocation("Kerala", "Ernakulam", 9.9816, 76.2999, "Vyttila Mobility Hub Dark Walkway", "Near South Bus Bay, Vyttila, Ernakulam, Kerala 682019", "Poorly lit connecting walkway between bus terminal and auto stand; broken streetlights reported frequently.", 4));
        templates.add(new ClusterLocation("Kerala", "Ernakulam", 9.9720, 76.2790, "MG Road Metro Backside Alley", "Behind Metro Pillar 684, MG Road, Ernakulam, Kerala 682011", "Isolated lane behind metro station exit with overgrown trees and insufficient evening surveillance.", 4));
        templates.add(new ClusterLocation("Kerala", "Ernakulam", 10.0159, 76.3117, "Kaloor Stadium Link Road", "Near JLN Stadium Metro Gate 2, Kaloor, Ernakulam, Kerala 682017", "Dimly lit stretch along stadium perimeter with lack of active security presence after 8 PM.", 3));
        templates.add(new ClusterLocation("Kerala", "Ernakulam", 10.0261, 76.3085, "Edappally Toll Pedestrian Underpass", "National Highway Bypass Junction, Edappally, Ernakulam, Kerala 682024", "Pedestrian subway underpass with non-functioning tube lights and isolated corner spots.", 5));
        templates.add(new ClusterLocation("Kerala", "Ernakulam", 9.9981, 76.3570, "Kakkanad InfoPark South Gate Stretch", "Infopark Expressway, Kakkanad, Ernakulam, Kerala 682042", "Desolate service road between tech campus gate and private hostel complexes.", 3));

        // 2. Kerala - Thrissur
        templates.add(new ClusterLocation("Kerala", "Thrissur", 10.5276, 76.2144, "Thekkinkadu Maidan North Perimeter", "North Ring Road, Near Swaraj Round, Thrissur, Kerala 680001", "Unlit sidewalk near tree grove along Swaraj Round; lack of pedestrian lighting after dusk.", 3));
        templates.add(new ClusterLocation("Kerala", "Thrissur", 10.5180, 76.2190, "Sakthan Thampuran Bus Stand Alley", "Behind Private Bus Stand, Sakthan Nagar, Thrissur, Kerala 680006", "Deserted alley behind commercial shops with no streetlights or security cameras.", 4));
        templates.add(new ClusterLocation("Kerala", "Thrissur", 10.5350, 76.2250, "Ayyanthole Civil Station Connector", "Collectorate Road, Ayyanthole, Thrissur, Kerala 680003", "Dark stretch connecting government quarters with main road; overgrown bushes.", 3));

        // 3. Kerala - Thiruvananthapuram
        templates.add(new ClusterLocation("Kerala", "Thiruvananthapuram", 8.5241, 76.9366, "Thampanoor Railway Subway", "Overbridge Road, Thampanoor, Thiruvananthapuram, Kerala 695001", "Pedestrian subway connecting south terminal with flickering lights and blind corners.", 4));
        templates.add(new ClusterLocation("Kerala", "Thiruvananthapuram", 8.5130, 76.9580, "Kowdiar - Vellayambalam Side Lane", "Near Manaveeyam Veedhi Cross Road, Thiruvananthapuram, Kerala 695010", "Poorly lit residential link road connecting main avenue; dark patches under dense canopy.", 3));
        templates.add(new ClusterLocation("Kerala", "Thiruvananthapuram", 8.5580, 76.8810, "Technopark Phase 1 Bypass Walkway", "Near Main Gate, Kazhakkoottam, Thiruvananthapuram, Kerala 695581", "Unlit road leading from campus gate towards local bus waiting sheds.", 4));

        // 4. Kerala - Kozhikode
        templates.add(new ClusterLocation("Kerala", "Kozhikode", 11.2588, 75.7804, "Mavoor Road Bus Stand Backside", "Near KSRTC Complex, Mavoor Road, Kozhikode, Kerala 673004", "Unlit service lane behind parcel booking office; uneven pavement and no CCTV.", 4));
        templates.add(new ClusterLocation("Kerala", "Kozhikode", 11.2420, 75.7710, "South Beach Promenade Extension", "Beach Road near Old Pier, Kozhikode, Kerala 673032", "Dimly lit seaside walkway beyond main active promenade; high bushes and isolated spots.", 3));

        // 5. Karnataka - Bengaluru Urban
        templates.add(new ClusterLocation("Karnataka", "Bengaluru Urban", 12.9176, 77.6234, "Silk Board Flyover Pedestrian Crossing", "Outer Ring Road Junction, Silk Board, Bengaluru, Karnataka 560068", "Poorly lit pedestrian crossway underneath flyover pillars with chaotic traffic and blind spots.", 5));
        templates.add(new ClusterLocation("Karnataka", "Bengaluru Urban", 12.9562, 77.7019, "Marathahalli Service Road Subway", "Near Foot Over Bridge, Marathahalli, Bengaluru, Karnataka 560037", "Non-functional lights inside pedestrian crossing with stagnant water and isolated entrance.", 4));
        templates.add(new ClusterLocation("Karnataka", "Bengaluru Urban", 12.9784, 77.6408, "Indiranagar 100ft Road Back Alley", "Behind 12th Main Commercial Complex, Indiranagar, Bengaluru, Karnataka 560038", "Dark service road behind popular cafes with frequent gathering of antisocial elements.", 4));
        templates.add(new ClusterLocation("Karnataka", "Bengaluru Urban", 12.8452, 77.6602, "Electronic City Phase 1 Toll Exit Walkway", "Near Infosys Gate 1, Electronic City, Bengaluru, Karnataka 560100", "Unlit pavement stretch connecting bus stop to elevated tollway walkway.", 3));
        templates.add(new ClusterLocation("Karnataka", "Bengaluru Urban", 12.9121, 77.6095, "BTM 2nd Stage Lake Perimeter Road", "Madiwala Lake Boundary Road, BTM 2nd Stage, Bengaluru, Karnataka 560076", "Isolated walkway along lake fence with defunct solar lamps and lack of police patrol.", 4));
        templates.add(new ClusterLocation("Karnataka", "Bengaluru Urban", 12.9698, 77.7499, "Whitefield Station Link Pathway", "Kadugodi Road, Whitefield, Bengaluru, Karnataka 560066", "Narrow unlit path between railway platform 3 and main road auto stand.", 5));

        // 6. Karnataka - Mysuru
        templates.add(new ClusterLocation("Karnataka", "Mysuru", 12.2958, 76.6394, "KSRTC Suburb Bus Stand Service Lane", "Behind Suburb Bus Stand, Mysuru, Karnataka 570001", "Unlit back road near state transport workshops; lacks public illumination.", 4));
        templates.add(new ClusterLocation("Karnataka", "Mysuru", 12.3120, 76.6180, "Kukkarahalli Lake West Gate Road", "University Road, Kukkarahalli, Mysuru, Karnataka 570005", "Dark tree-lined road leading to university campus after 7 PM.", 3));

        // 7. Tamil Nadu - Chennai
        templates.add(new ClusterLocation("Tamil Nadu", "Chennai", 13.0067, 80.2023, "Guindy MRTS Subway Pathway", "Near Race Course Road, Guindy, Chennai, Tamil Nadu 600032", "Dark pedestrian subway leading to MRTS concourse; broken overhead tube lights.", 4));
        templates.add(new ClusterLocation("Tamil Nadu", "Chennai", 13.0418, 80.2341, "T. Nagar Ranganathan Street Back Lane", "South Usman Road Junction, T. Nagar, Chennai, Tamil Nadu 600017", "Narrow service lane behind retail shops with poor illumination and heavy evening crowding.", 3));
        templates.add(new ClusterLocation("Tamil Nadu", "Chennai", 12.9360, 80.2310, "OMR Thoraipakkam Service Road", "Rajiv Gandhi Salai, Thoraipakkam, Chennai, Tamil Nadu 600097", "Unlit IT corridor service lane with construction debris and isolated bus shelters.", 4));
        templates.add(new ClusterLocation("Tamil Nadu", "Chennai", 12.9815, 80.2180, "Velachery Lake View Road", "Gandhi Nagar, Velachery, Chennai, Tamil Nadu 600042", "Deserted lake view stretch with malfunctioning streetlights and lack of surveillance.", 4));

        // 8. Tamil Nadu - Coimbatore
        templates.add(new ClusterLocation("Tamil Nadu", "Coimbatore", 11.0168, 76.9558, "Gandhipuram Bus Stand Connector", "Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu 641012", "Dark pedestrian pathway connecting Town Bus Stand to SETC depot.", 3));
        templates.add(new ClusterLocation("Tamil Nadu", "Coimbatore", 11.0280, 76.9820, "Avinashi Road Flyover Steps", "Near Lakshmi Mills Junction, Coimbatore, Tamil Nadu 641037", "Unlit staircase leading from flyover bus drop to service road.", 4));

        // 9. Maharashtra - Mumbai City
        templates.add(new ClusterLocation("Maharashtra", "Mumbai City", 19.0178, 72.8478, "Dadar West Flower Market Footbridge", "Senapati Bapat Marg, Dadar West, Mumbai, Maharashtra 400028", "Extremely congested skywalk stairs with dim lighting and frequent pickpocket reports.", 4));
        templates.add(new ClusterLocation("Maharashtra", "Mumbai City", 18.9986, 72.8315, "Lower Parel Railway Yard Pathway", "NM Joshi Marg, Lower Parel, Mumbai, Maharashtra 400013", "Isolated pathway along railway yard with poor lighting near old mill compounds.", 5));
        templates.add(new ClusterLocation("Maharashtra", "Mumbai City", 19.1136, 72.8697, "Andheri Kurla Road Underpass", "Near Chakala Metro Station, Andheri East, Mumbai, Maharashtra 400093", "Flickering lights and unmonitored corners inside pedestrian underpass.", 4));
        templates.add(new ClusterLocation("Maharashtra", "Mumbai City", 19.0688, 72.8911, "Kurla LTT Terminus Approach", "Tilak Nagar Link Road, Kurla, Mumbai, Maharashtra 400089", "Long desolate stretch leading to long-distance train terminal; defective streetlights.", 5));

        // 10. Maharashtra - Pune
        templates.add(new ClusterLocation("Maharashtra", "Pune", 18.5912, 73.7389, "Hinjawadi Phase 2 Service Road", "Wipro Circle to Rajiv Gandhi Infotech Park, Hinjawadi, Pune, Maharashtra 411057", "Unlit pedestrian sidewalk along tech park perimeter; irregular evening security patrol.", 4));
        templates.add(new ClusterLocation("Maharashtra", "Pune", 18.5308, 73.8475, "Shivajinagar Bus Depot Underpass", "Near Old Pune-Mumbai Highway, Shivajinagar, Pune, Maharashtra 411005", "Dimly lit subway with broken lamps and damp blind corners.", 4));
        templates.add(new ClusterLocation("Maharashtra", "Pune", 18.5679, 73.9143, "Viman Nagar Symbiosis Back Road", "Row House Road, Viman Nagar, Pune, Maharashtra 411014", "Dark residential stretch used by students returning from libraries and college.", 3));

        // 11. Maharashtra - Nagpur
        templates.add(new ClusterLocation("Maharashtra", "Nagpur", 21.1458, 79.0882, "Sitabuldi Market Backside Lane", "Near Variety Square, Sitabuldi, Nagpur, Maharashtra 440012", "Unlit shopping alley behind commercial establishments with no evening illumination.", 4));
        templates.add(new ClusterLocation("Maharashtra", "Nagpur", 21.1520, 79.0810, "Nagpur Station West Underbridge", "Station Road, Mohan Nagar, Nagpur, Maharashtra 440001", "Dim railway underbridge with poor pedestrian walkway separation.", 4));

        // 12. Delhi - Central Delhi
        templates.add(new ClusterLocation("Delhi", "Central Delhi", 28.6328, 77.2197, "Connaught Place Outer Circle Block M Alley", "Behind Radial Road 7, Connaught Place, Central Delhi, Delhi 110001", "Narrow service alley behind heritage buildings with burnt out halogen lights.", 4));
        templates.add(new ClusterLocation("Delhi", "Central Delhi", 28.6448, 77.2167, "New Delhi Station Paharganj Exit Lane", "Arakashan Road, Paharganj, Central Delhi, Delhi 110055", "Poorly lit crowded alley with aggressive soliciting and lack of adequate police booths.", 5));

        // 13. Delhi - South Delhi
        templates.add(new ClusterLocation("Delhi", "South Delhi", 28.5535, 77.1945, "Hauz Khas Village Forest Boundary Path", "Near Deer Park Entrance, Hauz Khas, South Delhi, Delhi 110016", "Completely dark trail bordering the forest area near party venues after 9 PM.", 5));
        templates.add(new ClusterLocation("Delhi", "South Delhi", 28.5244, 77.2183, "Saket Metro to Select Citywalk Path", "Press Enclave Marg, Saket, South Delhi, Delhi 110017", "Unlit sidewalk between metro station gate 2 and mall entrance under dense tree cover.", 4));
        templates.add(new ClusterLocation("Delhi", "South Delhi", 28.5677, 77.2433, "Lajpat Nagar Ring Road Bus Stand Underbridge", "Near Flyover Pillar 12, Lajpat Nagar IV, South Delhi, Delhi 110024", "Dark underbridge pedestrian walkway with non-working street lamps.", 4));

        // 14. Telangana - Hyderabad
        templates.add(new ClusterLocation("Telangana", "Hyderabad", 17.4435, 78.3772, "Hitec City Cyber Towers Back Road", "Near Mindspace Junction, Madhapur, Hyderabad, Telangana 500081", "Dark link road between IT parks; overgrown trees block overhead streetlights.", 4));
        templates.add(new ClusterLocation("Telangana", "Hyderabad", 17.4344, 78.5013, "Secunderabad Clock Tower Subway", "Station Road, Secunderabad, Hyderabad, Telangana 500003", "Pedestrian subway with broken tiles and insufficient tube lighting.", 4));
        templates.add(new ClusterLocation("Telangana", "Hyderabad", 17.4401, 78.3489, "Gachibowli Stadium Perimeter Walk", "Old Mumbai Highway, Gachibowli, Hyderabad, Telangana 500032", "Desolate stretch around sports stadium boundary wall with no footpaths.", 3));

        // 15. Gujarat - Ahmedabad
        templates.add(new ClusterLocation("Gujarat", "Ahmedabad", 23.0300, 72.5800, "Sabarmati Riverfront West Lower Walkway", "Near Ashram Road Ramp, Ahmedabad, Gujarat 380009", "Isolated lower riverfront walkway with dark sections between illumination poles.", 3));
        templates.add(new ClusterLocation("Gujarat", "Ahmedabad", 23.0225, 72.5714, "Kalupur Station Overbridge Steps", "Station Road, Kalupur, Ahmedabad, Gujarat 380002", "Unlit steep pedestrian stairs connecting platform overbridge to eastern exit.", 4));

        // 16. Gujarat - Surat
        templates.add(new ClusterLocation("Gujarat", "Surat", 21.1950, 72.8420, "Ring Road Textile Market Service Lane", "Near Millennium Market, Surat, Gujarat 395002", "Narrow unlit lane packed with transport carts and no functional streetlamps.", 4));
        templates.add(new ClusterLocation("Gujarat", "Surat", 21.1520, 72.7810, "Dumas Beach Road Isolated Stretch", "Sultanabad Road, Dumas, Surat, Gujarat 395007", "Dark stretch of coastal highway with infrequent patrols after 8 PM.", 4));

        // 17. West Bengal - Kolkata
        templates.add(new ClusterLocation("West Bengal", "Kolkata", 22.5697, 78.3712, "Sealdah Station South Underpass", "Beliaghata Main Road, Sealdah, Kolkata, West Bengal 700014", "Poorly lit underpass with broken pavements and absence of police kiosk.", 5));
        templates.add(new ClusterLocation("West Bengal", "Kolkata", 22.5800, 88.4300, "Salt Lake Sector V Tech Hub Link Lane", "Near College More, Sector V, Salt Lake, Kolkata, West Bengal 700091", "Deserted lane behind IT tech parks with non-functioning sodium vapor lights.", 3));
        templates.add(new ClusterLocation("West Bengal", "Kolkata", 22.5530, 88.3510, "Park Street Metro Station Side Exit", "Behind Indian Museum, Park Street, Kolkata, West Bengal 700016", "Dimly lit narrow lane connecting metro exit with Russell Street.", 4));

        // 18. Uttar Pradesh - Lucknow
        templates.add(new ClusterLocation("Uttar Pradesh", "Lucknow", 26.8320, 80.9210, "Charbagh Station Bus Stop Lane", "Station Road, Charbagh, Lucknow, Uttar Pradesh 226004", "Unlit auto stand alley behind main heritage terminal building.", 4));
        templates.add(new ClusterLocation("Uttar Pradesh", "Lucknow", 26.8610, 80.9920, "Gomti Nagar Marine Drive Dark Stretch", "Near Samta Mulak Chowk, Gomti Nagar, Lucknow, Uttar Pradesh 226010", "River promenade stretch with defunct lamp posts and isolated benches.", 3));

        // 19. Uttar Pradesh - Noida (Gautam Buddha Nagar)
        templates.add(new ClusterLocation("Uttar Pradesh", "Noida (Gautam Buddha Nagar)", 28.6280, 77.3640, "Sector 62 Metro Service Road", "Near Electronic City Roundabout, Sector 62, Noida (Gautam Buddha Nagar), Uttar Pradesh 201309", "Unlit service lane parallel to highway with deep ditches and no pedestrian lights.", 4));
        templates.add(new ClusterLocation("Uttar Pradesh", "Noida (Gautam Buddha Nagar)", 28.5700, 77.3260, "Sector 18 Atta Market Backside Alley", "Behind Commercial Complex, Sector 18, Noida (Gautam Buddha Nagar), Uttar Pradesh 201301", "Dark parking lane behind market complexes with frequent harassment reports.", 4));

        // 20. Rajasthan - Jaipur
        templates.add(new ClusterLocation("Rajasthan", "Jaipur", 26.9200, 75.8010, "Sindhi Camp Bus Stand Back Exit", "Station Road, Sindhi Camp, Jaipur, Rajasthan 302001", "Dark alley behind bus parking yard; lack of streetlights and CCTV.", 4));
        templates.add(new ClusterLocation("Rajasthan", "Jaipur", 26.8520, 75.8110, "Malviya Nagar GT Central Back Lane", "Near GT Central, Malviya Nagar, Jaipur, Rajasthan 302017", "Dim service lane between commercial malls with deserted corners after 9 PM.", 3));

        // 21. Andhra Pradesh - Visakhapatnam
        templates.add(new ClusterLocation("Andhra Pradesh", "Visakhapatnam", 17.7210, 83.3050, "RTC Complex Backside Pathway", "Dwarka Nagar, Visakhapatnam, Andhra Pradesh 530016", "Unlit walkway connecting bus complex with commercial shopping arcade.", 4));
        templates.add(new ClusterLocation("Andhra Pradesh", "Visakhapatnam", 17.7080, 83.3210, "RK Beach South Coastal Stretch", "Beach Road, Visakhapatnam, Andhra Pradesh 530001", "Desolate stretch beyond main tourist light poles; dark beachside path.", 3));

        // 22. Assam - Guwahati / Kamrup
        templates.add(new ClusterLocation("Assam", "Guwahati / Kamrup", 26.1820, 91.7510, "Paltan Bazar Station Approach Alley", "Station Road, Paltan Bazar, Guwahati / Kamrup, Assam 781008", "Narrow unlit road with muddy potholes and lack of pedestrian safety lights.", 4));
        templates.add(new ClusterLocation("Assam", "Guwahati / Kamrup", 26.1150, 91.8020, "GS Road Khanapara Underbridge", "Near Veterinary College Ground, Guwahati / Kamrup, Assam 781022", "Dim underpass area with infrequent police patrol and isolated auto stands.", 3));

        // 23. Punjab - Amritsar
        templates.add(new ClusterLocation("Punjab", "Amritsar", 31.6340, 74.8723, "ISBT Amritsar Exit Road", "Near City Center, Amritsar, Punjab 143001", "Unlit connector road between bus depot and GT Road with heavy diesel smog.", 4));
        templates.add(new ClusterLocation("Punjab", "Amritsar", 31.6280, 74.8780, "Hall Bazaar Narrow Back Lanes", "Near Hall Gate, Amritsar, Punjab 143006", "Winding dark market streets with overhead tangled wires and no lamp posts.", 3));

        // 24. Bihar - Patna
        templates.add(new ClusterLocation("Bihar", "Patna", 25.6020, 85.1320, "Patna Junction Mahavir Mandir Subway", "Fraser Road, Patna, Bihar 800001", "Dark pedestrian subway with missing bulbs and stagnant water seepage.", 5));
        templates.add(new ClusterLocation("Bihar", "Patna", 25.6180, 85.1450, "Gandhi Maidan South Gate Walkway", "Ashok Rajpath, Gandhi Maidan, Patna, Bihar 800004", "Unlit sidewalk under massive trees along perimeter of public ground.", 3));

        // 25. Madhya Pradesh - Indore
        templates.add(new ClusterLocation("Madhya Pradesh", "Indore", 22.7160, 75.8650, "Sarwate Bus Stand Railway Link Path", "Chhoti Gwaltoli, Indore, Madhya Pradesh 452001", "Narrow alley connecting railway station platform 1 to bus stand; no lights.", 4));
        templates.add(new ClusterLocation("Madhya Pradesh", "Indore", 22.7530, 75.8920, "Vijay Nagar Scheme 54 Link Road", "Near Meghdoot Garden, Vijay Nagar, Indore, Madhya Pradesh 452010", "Desolate service road behind business parks with non-working LED poles.", 3));

        // 26. Odisha - Bhubaneswar / Khordha
        templates.add(new ClusterLocation("Odisha", "Bhubaneswar / Khordha", 20.2680, 85.8410, "Master Canteen Station Subway", "Station Square, Bhubaneswar / Khordha, Odisha 751001", "Pedestrian subway connecting platform to bus stop with dark corners.", 4));
        templates.add(new ClusterLocation("Odisha", "Bhubaneswar / Khordha", 20.3540, 85.8190, "Patia Infocity Back Road", "KIIT Square to Infocity, Bhubaneswar / Khordha, Odisha 751024", "Unlit road behind student hostels and software parks with dense bushes.", 3));

        // 27. Goa - North Goa
        templates.add(new ClusterLocation("Goa", "North Goa", 15.4989, 73.8278, "Panaji KTC Bus Stand Ferry Wharf Pathway", "Patto Plaza, Panaji, North Goa, Goa 403001", "Dim path connecting bus terminal to river wharf; missing streetlights.", 3));
        templates.add(new ClusterLocation("Goa", "North Goa", 15.5560, 73.7540, "Calangute - Baga Inner Link Lane", "Tito's Lane Cross Road, Baga, North Goa, Goa 403516", "Dark narrow lane between night spots with unmonitored corners.", 4));

        // 28. Uttarakhand - Dehradun
        templates.add(new ClusterLocation("Uttarakhand", "Dehradun", 30.2850, 78.0090, "ISBT Dehradun Bypass Service Lane", "Near Transport Nagar, Dehradun, Uttarakhand 248001", "Unlit bypass service road with steep roadside slopes and no lighting.", 4));
        templates.add(new ClusterLocation("Uttarakhand", "Dehradun", 30.3420, 78.0610, "Rajpur Road Canal Shortcut", "Near Dilaram Chowk, Dehradun, Uttarakhand 248009", "Deserted shortcut road along canal with tree canopy and no streetlamps.", 3));

        // 29. Jharkhand - Ranchi
        templates.add(new ClusterLocation("Jharkhand", "Ranchi", 23.3510, 85.3280, "Ranchi Station Overbridge Walkway", "Station Road, Chutia, Ranchi, Jharkhand 834001", "Pedestrian footbridge with defunct lights and isolated descent stairs.", 4));
        templates.add(new ClusterLocation("Jharkhand", "Ranchi", 23.3640, 85.3210, "Main Road GEL Church Back Alley", "Near GEL Church Complex, Ranchi, Jharkhand 834001", "Dark alley behind commercial complex with zero night illumination.", 4));

        // 30. Haryana - Gurugram
        templates.add(new ClusterLocation("Haryana", "Gurugram", 28.4710, 77.0720, "IFFCO Chowk Flyover Underpass", "MG Road Junction, Gurugram, Haryana 122002", "Dark underpass under expressway flyover with heavy vehicular noise and blind turns.", 4));
        templates.add(new ClusterLocation("Haryana", "Gurugram", 28.4680, 77.0610, "Sector 29 Leisure Valley Walkway", "City Center, Sector 29, Gurugram, Haryana 122001", "Unlit pathway surrounding park grounds near metro station after 8 PM.", 3));

        return templates;
    }

    // =========================================================================
    // Status Query
    // =========================================================================
    public Map<String, Object> getDemoDataStatus() {
        Map<String, Object> status = new LinkedHashMap<>();

        // Demo users count
        long demoUsersCount = tursoClient.queryOne(
                "SELECT COUNT(*) AS cnt FROM users WHERE email LIKE '%" + DEMO_DOMAIN + "'"
        ).map(r -> ((Number) r.get("cnt")).longValue()).orElse(0L);

        // Demo reports count
        long demoReportsCount = tursoClient.queryOne(
                "SELECT COUNT(*) AS cnt FROM places WHERE submitted_by IN (SELECT id FROM users WHERE email LIKE '%" + DEMO_DOMAIN + "')"
        ).map(r -> ((Number) r.get("cnt")).longValue()).orElse(0L);

        // Reports with null or zero coordinates
        long nullCoordsCount = tursoClient.queryOne(
                "SELECT COUNT(*) AS cnt FROM places WHERE submitted_by IN (SELECT id FROM users WHERE email LIKE '%" + DEMO_DOMAIN + "') AND (latitude IS NULL OR longitude IS NULL OR latitude = 0.0 OR longitude = 0.0)"
        ).map(r -> ((Number) r.get("cnt")).longValue()).orElse(0L);

        // Status breakdown
        long acceptedCount = tursoClient.queryOne(
                "SELECT COUNT(*) AS cnt FROM places WHERE submitted_by IN (SELECT id FROM users WHERE email LIKE '%" + DEMO_DOMAIN + "') AND status = 'accepted' AND (resolved = 0 OR resolved IS NULL)"
        ).map(r -> ((Number) r.get("cnt")).longValue()).orElse(0L);

        long pendingCount = tursoClient.queryOne(
                "SELECT COUNT(*) AS cnt FROM places WHERE submitted_by IN (SELECT id FROM users WHERE email LIKE '%" + DEMO_DOMAIN + "') AND status = 'pending'"
        ).map(r -> ((Number) r.get("cnt")).longValue()).orElse(0L);

        long resolvedCount = tursoClient.queryOne(
                "SELECT COUNT(*) AS cnt FROM places WHERE submitted_by IN (SELECT id FROM users WHERE email LIKE '%" + DEMO_DOMAIN + "') AND status = 'accepted' AND resolved = 1"
        ).map(r -> ((Number) r.get("cnt")).longValue()).orElse(0L);

        long rejectedCount = tursoClient.queryOne(
                "SELECT COUNT(*) AS cnt FROM places WHERE submitted_by IN (SELECT id FROM users WHERE email LIKE '%" + DEMO_DOMAIN + "') AND status = 'rejected'"
        ).map(r -> ((Number) r.get("cnt")).longValue()).orElse(0L);

        // Check if every demo user has exactly 2 reports
        long usersWithNonTwoReports = tursoClient.queryOne(
                "SELECT COUNT(*) AS cnt FROM (SELECT submitted_by, COUNT(*) as rcnt FROM places WHERE submitted_by IN (SELECT id FROM users WHERE email LIKE '%" + DEMO_DOMAIN + "') GROUP BY submitted_by HAVING rcnt != 2)"
        ).map(r -> ((Number) r.get("cnt")).longValue()).orElse(0L);

        // Community ratings count for demo places
        long ratingsCount = tursoClient.queryOne(
                "SELECT COUNT(*) AS cnt FROM place_ratings WHERE place_id IN (SELECT id FROM places WHERE submitted_by IN (SELECT id FROM users WHERE email LIKE '%" + DEMO_DOMAIN + "'))"
        ).map(r -> ((Number) r.get("cnt")).longValue()).orElse(0L);

        // Notifications count for demo users
        long notifsCount = tursoClient.queryOne(
                "SELECT COUNT(*) AS cnt FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%" + DEMO_DOMAIN + "')"
        ).map(r -> ((Number) r.get("cnt")).longValue()).orElse(0L);

        boolean isFullySeeded = (demoUsersCount == TARGET_USERS_COUNT) &&
                                (demoReportsCount == TARGET_REPORTS_COUNT) &&
                                (nullCoordsCount == 0) &&
                                (usersWithNonTwoReports == 0) &&
                                (acceptedCount == ACCEPTED_COUNT) &&
                                (pendingCount == PENDING_COUNT) &&
                                (resolvedCount == RESOLVED_COUNT) &&
                                (rejectedCount == REJECTED_COUNT);

        status.put("isFullySeeded", isFullySeeded);
        status.put("demoDomain", DEMO_DOMAIN);
        status.put("demoUsersCount", demoUsersCount);
        status.put("targetUsersCount", TARGET_USERS_COUNT);
        status.put("demoReportsCount", demoReportsCount);
        status.put("targetReportsCount", TARGET_REPORTS_COUNT);
        status.put("reportsPerUserExact2", usersWithNonTwoReports == 0 && demoUsersCount > 0);
        status.put("usersWithNonTwoReportsCount", usersWithNonTwoReports);
        status.put("nullOrZeroCoordinatesCount", nullCoordsCount);
        status.put("allCoordinatesValid", nullCoordsCount == 0 && demoReportsCount > 0);
        
        Map<String, Object> dist = new LinkedHashMap<>();
        dist.put("accepted", acceptedCount);
        dist.put("pending", pendingCount);
        dist.put("resolved", resolvedCount);
        dist.put("rejected", rejectedCount);
        dist.put("total", acceptedCount + pendingCount + resolvedCount + rejectedCount);
        status.put("statusDistribution", dist);

        status.put("communityRatingsCount", ratingsCount);
        status.put("notificationsCount", notifsCount);

        return status;
    }

    // =========================================================================
    // Safe Isolated Demo Cleanup (Safeguard 2)
    // =========================================================================
    public Map<String, Object> cleanupDemoData() {
        log.info("Starting safe, isolated cleanup for demo data domain: {}", DEMO_DOMAIN);

        // 1. Delete ratings on demo places or created by demo users
        String deleteRatingsSql = """
            DELETE FROM place_ratings 
            WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.womensafety.internal')
               OR place_id IN (SELECT id FROM places WHERE submitted_by IN (SELECT id FROM users WHERE email LIKE '%@demo.womensafety.internal'))
        """;
        int ratingsDeleted = tursoClient.update(deleteRatingsSql).affectedRows();

        // 2. Delete notifications for demo users or referring to demo places
        String deleteNotifsSql = """
            DELETE FROM notifications 
            WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.womensafety.internal')
               OR place_id IN (SELECT id FROM places WHERE submitted_by IN (SELECT id FROM users WHERE email LIKE '%@demo.womensafety.internal'))
        """;
        int notifsDeleted = tursoClient.update(deleteNotifsSql).affectedRows();

        // 3. Delete any companion/safe walk records for demo users
        try {
            tursoClient.update("""
                DELETE FROM companion_relationships 
                WHERE requester_id IN (SELECT id FROM users WHERE email LIKE '%@demo.womensafety.internal')
                   OR recipient_id IN (SELECT id FROM users WHERE email LIKE '%@demo.womensafety.internal')
            """);
            tursoClient.update("""
                DELETE FROM safe_walks 
                WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.womensafety.internal')
                   OR companion_id IN (SELECT id FROM users WHERE email LIKE '%@demo.womensafety.internal')
            """);
        } catch (Exception ignored) {}

        // 4. Delete demo places
        String deletePlacesSql = """
            DELETE FROM places 
            WHERE submitted_by IN (SELECT id FROM users WHERE email LIKE '%@demo.womensafety.internal')
        """;
        int placesDeleted = tursoClient.update(deletePlacesSql).affectedRows();

        // 5. Delete demo users
        String deleteUsersSql = """
            DELETE FROM users 
            WHERE email LIKE '%@demo.womensafety.internal'
        """;
        int usersDeleted = tursoClient.update(deleteUsersSql).affectedRows();

        log.info("Demo data cleanup complete. Removed: {} users, {} places, {} ratings, {} notifications.",
                usersDeleted, placesDeleted, ratingsDeleted, notifsDeleted);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("usersDeleted", usersDeleted);
        result.put("placesDeleted", placesDeleted);
        result.put("ratingsDeleted", ratingsDeleted);
        result.put("notificationsDeleted", notifsDeleted);
        result.put("message", "Demo data isolated cleanup executed successfully.");
        return result;
    }

    // =========================================================================
    // Atomic Demo Data Seeder (Safeguard 1)
    // =========================================================================
    public Map<String, Object> seedDemoData(boolean force) {
        log.info("Triggered seedDemoData (force={})", force);

        // Pre-check: if already seeded and force is false, return current status
        Map<String, Object> currentStatus = getDemoDataStatus();
        long existingUsers = (long) currentStatus.get("demoUsersCount");
        if (existingUsers > 0) {
            if (!force) {
                log.info("Demo dataset already seeded with {} users. Set force=true to re-seed.", existingUsers);
                Map<String, Object> skipped = new LinkedHashMap<>();
                skipped.put("success", true);
                skipped.put("message", "Demo dataset already exists (" + existingUsers + " users). Use force=true to replace.");
                skipped.put("status", currentStatus);
                return skipped;
            } else {
                log.info("Force flag is true. Cleaning up existing demo data before re-seeding...");
                cleanupDemoData();
            }
        }

        List<ClusterLocation> templates = buildLocationTemplates();
        int templateCount = templates.size();

        String passwordHash = passwordEncoder.encode(DEMO_PASSWORD_PLAIN);
        List<Long> createdUserIds = new ArrayList<>();
        List<Long> createdPlaceIds = new ArrayList<>();
        int ratingsCreatedCount = 0;
        int notifsCreatedCount = 0;

        try {
            // STEP 1: Create 100 Demo Users
            log.info("Step 1/4: Inserting 100 demo users...");
            for (int i = 1; i <= TARGET_USERS_COUNT; i++) {
                String userNum = String.format("%03d", i);
                String name = "Demo User " + userNum;
                String email = "demo.user" + userNum + DEMO_DOMAIN;
                
                // Distribute user location realistically based on district templates
                ClusterLocation loc = templates.get((i - 1) % templateCount);
                String state = loc.state();
                String district = loc.district();
                String phone = "+91 98765 43" + userNum;
                String role = "user";

                String insertUserSql = "INSERT INTO users (name, email, password_hash, state, district, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)";
                TursoClient.ExecuteResult userRes = tursoClient.update(insertUserSql, List.of(
                        name, email, passwordHash, state, district, phone, role
                ));

                Long userId = userRes.lastInsertRowid();
                if (userId == null) {
                    // Fallback query by email if rowid was omitted
                    userId = tursoClient.queryOne("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", List.of(email))
                            .map(r -> ((Number) r.get("id")).longValue())
                            .orElseThrow(() -> new IllegalStateException("Failed to retrieve generated user ID for " + email));
                }
                createdUserIds.add(userId);
            }

            if (createdUserIds.size() != TARGET_USERS_COUNT) {
                throw new IllegalStateException("Expected 100 created users, but found " + createdUserIds.size());
            }

            // STEP 2: Create 200 Demo Reports (Exactly 2 per demo user)
            log.info("Step 2/4: Inserting 200 demo reports linked 2-per-user...");
            for (int r = 0; r < TARGET_REPORTS_COUNT; r++) {
                int userIndex = r / REPORTS_PER_USER;
                Long submittedByUserId = createdUserIds.get(userIndex);

                // Select location template and apply realistic micro-offsets
                ClusterLocation template = templates.get(r % templateCount);
                int variationIndex = r / templateCount;

                // Micro-offsets in range ±0.005 to ±0.030 degrees
                double offsetLat = ((double) ((r * 17) % 61 - 30)) * 0.00075;
                double offsetLon = ((double) ((r * 23) % 61 - 30)) * 0.00075;

                double lat = Math.round((template.baseLat() + offsetLat) * 1000000.0) / 1000000.0;
                double lon = Math.round((template.baseLon() + offsetLon) * 1000000.0) / 1000000.0;

                String placeName = template.placeName();
                if (variationIndex > 0) {
                    String[] suffixes = {" North", " South Link", " Extension", " Sector " + (variationIndex + 1), " Near Gate " + (variationIndex + 1)};
                    placeName += suffixes[variationIndex % suffixes.length];
                }

                String address = template.address();
                String description = template.description();
                int rating = template.initialRating();
                String photo = ""; // No fake images; store empty string as required

                // Determine Status according to the required distribution:
                // 0..99: Accepted (100)
                // 100..159: Pending (60)
                // 160..179: Resolved (20)
                // 180..199: Rejected (20)
                String status;
                int resolved = 0;
                String resolvedAt = null;

                if (r < ACCEPTED_COUNT) {
                    // Accepted
                    status = "accepted";
                    resolved = 0;
                    resolvedAt = null;
                } else if (r < ACCEPTED_COUNT + PENDING_COUNT) {
                    // Pending
                    status = "pending";
                    resolved = 0;
                    resolvedAt = null;
                } else if (r < ACCEPTED_COUNT + PENDING_COUNT + RESOLVED_COUNT) {
                    // Resolved (visible on map and admin dashboard)
                    status = "accepted";
                    resolved = 1;
                    int daysAgo = 1 + (r % 4); // 1 to 4 days ago
                    resolvedAt = String.format("2026-10-%02d 14:30:00", Math.max(1, 5 - daysAgo));
                } else {
                    // Rejected
                    status = "rejected";
                    resolved = 0;
                    resolvedAt = null;
                }

                String insertPlaceSql = """
                    INSERT INTO places (
                        name, address, state, district, latitude, longitude, photo, rating, description, status, resolved, resolved_at, submitted_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

                TursoClient.ExecuteResult placeRes = tursoClient.update(insertPlaceSql, Arrays.asList(
                        placeName,
                        address,
                        template.state(),
                        template.district(),
                        lat,
                        lon,
                        photo,
                        rating,
                        description,
                        status,
                        resolved,
                        resolvedAt,
                        submittedByUserId
                ));

                Long placeId = placeRes.lastInsertRowid();
                if (placeId == null) {
                    final int reportIdx = r;
                    placeId = tursoClient.queryOne(
                            "SELECT id FROM places WHERE submitted_by = ? ORDER BY id DESC LIMIT 1",
                            List.of(submittedByUserId)
                    ).map(row -> ((Number) row.get("id")).longValue())
                     .orElseThrow(() -> new IllegalStateException("Failed to retrieve place ID for report " + reportIdx));
                }
                createdPlaceIds.add(placeId);
            }

            if (createdPlaceIds.size() != TARGET_REPORTS_COUNT) {
                throw new IllegalStateException("Expected 200 created places, but found " + createdPlaceIds.size());
            }

            // STEP 3: Community Ratings for Accepted & Resolved Places
            log.info("Step 3/4: Creating community ratings for accepted and resolved places...");
            for (int r = 0; r < TARGET_REPORTS_COUNT; r++) {
                // Rate accepted (0..99) and resolved (160..179) places
                if (r < ACCEPTED_COUNT || (r >= ACCEPTED_COUNT + PENDING_COUNT && r < ACCEPTED_COUNT + PENDING_COUNT + RESOLVED_COUNT)) {
                    Long placeId = createdPlaceIds.get(r);
                    int reporterIdx = r / REPORTS_PER_USER;

                    // Add 3 ratings per accepted/resolved place from other demo users
                    int[] offsets = {7, 23, 51};
                    for (int offset : offsets) {
                        int raterIdx = (reporterIdx + offset) % TARGET_USERS_COUNT;
                        Long raterUserId = createdUserIds.get(raterIdx);
                        int communityRatingValue = Math.max(1, Math.min(5, ((r + offset) % 5) + 1));

                        String insertRatingSql = "INSERT OR IGNORE INTO place_ratings (place_id, user_id, rating) VALUES (?, ?, ?)";
                        tursoClient.update(insertRatingSql, List.of(placeId, raterUserId, communityRatingValue));
                        ratingsCreatedCount++;
                    }
                }
            }

            // STEP 4: Status Update Notifications
            log.info("Step 4/4: Generating notifications for report submitters...");
            for (int r = 0; r < TARGET_REPORTS_COUNT; r++) {
                Long placeId = createdPlaceIds.get(r);
                int userIdx = r / REPORTS_PER_USER;
                Long userId = createdUserIds.get(userIdx);

                if (r < ACCEPTED_COUNT) {
                    // Accepted notification
                    tursoClient.update(
                            "INSERT INTO notifications (user_id, place_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)",
                            List.of(userId, placeId, "Report Approved", "Your safety report has been approved by admin and published to the Safety Map.", "status_update", 0)
                    );
                    notifsCreatedCount++;
                } else if (r >= ACCEPTED_COUNT + PENDING_COUNT && r < ACCEPTED_COUNT + PENDING_COUNT + RESOLVED_COUNT) {
                    // Resolved notification
                    tursoClient.update(
                            "INSERT INTO notifications (user_id, place_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)",
                            List.of(userId, placeId, "Safety Concern Resolved", "The reported safety concern has been verified as resolved by local authorities. Thank you!", "status_update", 0)
                    );
                    notifsCreatedCount++;
                } else if (r >= ACCEPTED_COUNT + PENDING_COUNT + RESOLVED_COUNT) {
                    // Rejected notification
                    tursoClient.update(
                            "INSERT INTO notifications (user_id, place_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)",
                            List.of(userId, placeId, "Report Status Update", "Your submitted report was reviewed by admin and could not be verified at this time.", "status_update", 0)
                    );
                    notifsCreatedCount++;
                }
            }

            // POST-SEED VALIDATION
            Map<String, Object> postStatus = getDemoDataStatus();
            boolean isValid = (boolean) postStatus.get("isFullySeeded");
            if (!isValid) {
                log.error("Post-seed validation failed! Status: {}", postStatus);
                throw new IllegalStateException("Post-seed validation checks failed. Rolling back dataset.");
            }

            log.info("Demo data seeding completed successfully: 100 users, 200 reports, {} ratings, {} notifications.",
                    ratingsCreatedCount, notifsCreatedCount);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("message", "Demo data seeded successfully.");
            result.put("seededSummary", postStatus);
            return result;

        } catch (Exception e) {
            log.error("Fatal error during demo data seed operation: {}. Triggering automatic rollback...", e.getMessage(), e);
            // Safeguard 1: Immediate clean rollback on error
            cleanupDemoData();
            throw new RuntimeException("Demo data seed operation failed and was cleanly rolled back: " + e.getMessage(), e);
        }
    }
}
