import { StyleSheet } from 'react-native';

export default styles = StyleSheet.create({

    // PlayerCard Styles

    playerCardContainer: {
        marginTop: 20,
        alignItems: 'flex-start',
    },

    playerInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 5,
    },
    playerNameContainer: {
        marginLeft: 10,
    },

    playerCardName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },

    playerCardPlayerID: {
        fontSize: 8,
        color: '#888',
        textAlign: 'center',
        marginTop: 5,
    },

    playerCardModalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },

    playerCardModalContainer: {
        width: '80%',
        padding: 20,
        backgroundColor: 'rgba(240, 190, 154, 0.98)',
        borderRadius: 10,
        alignItems: 'center',
    },
    trophyContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        height: "100%", 
        width: "100%", 
    },
    playerCardTrophyImage: {
        width: '100%',  
        height: '100%', 
        resizeMode: 'cover',
    },
    trophyText: {
        position: 'absolute',
        bottom: 0, 
        left: 0,
        right: 0,
        textAlign: 'center', 
        color: '#ffffffff',
        fontSize: 9,
        fontWeight: 'bold',
    },
    
// Avatar Styles
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        marginBottom: 0,
        borderWidth: 1,
        padding: 1,
        borderColor: '#00000063',
        marginRight: 5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
    },
    avatarModalBackground: {
        flex: 1,
        marginTop: '15%',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },

    avatarModalContainer: {
        width: '80%',
        height: '90%',
        backgroundColor: '#141414', 
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fff',
    },

    avatarSelectionWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        width: '100%',
    },

    avatar: {
        width: "100%",
        height: "100%",
        borderRadius: 50,
        margin: 5,
        resizeMode: 'cover',
    },

    editAvatarButton: {
        position: 'absolute',
        left: 80,
        bottom: 0,
        borderWidth: 1,
        backgroundColor: '#ff0000ff',
        borderRadius: 20,
        padding: 5,
    },
    avatarSelectText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#fff',
    },

    avatarModalImageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 50,
        borderColor: '#fff', 
        borderWidth: 2,
    },

    avatarModalImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
        padding: 2,
        margin: 5,
        resizeMode: 'contain',
    },
    closeAvatarModalButton: {
        position: 'absolute',
        right: 10,
        top: 2,
        color: '#fff',
        fontSize: 22,
    },
    closeAvatarModalText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        padding: 5,
    },

    scoreRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

    },

    playerCardScoresContainer: {
        marginTop: 10,
        marginBottom: 5,
    },

    playerCardScoresTitle: {
        fontSize: 18,
        marginBottom: 10,
        textAlign: 'center',
        fontWeight: 'bold',
    },

    playerCardScoreItem: {
        fontSize: 14,
        fontWeight: 'normal',
        color: '#000',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        width: '100%',
        marginLeft: 15,
    },

    playerCardScoreDate: {
        fontSize: 10,
        color: '#777',
        textAlign: 'right',
        flex: 1,
        paddingTop: 5,
        marginRight: 15,
    },

    playerCardTrophyCase: {
        width: '100%',
        alignItems: 'center',
    },

    playerCardTrophyCaseTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    playerCardMonthsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '90%',
    },

    playerCardMonth: {
        width: '24%',
        height: 85,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        backgroundColor: '#f3f3f3',
        borderRadius: 5,
        position: 'relative',
        flexDirection: 'column',
        borderColor: '#000',
        borderWidth: 1,
    },

    playerCardOngoingMonth: {
        borderColor: 'darkorange',
        borderWidth: 3,
    },

    playerCardMonthText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
        top: -4,
        marginBottom: 10,
        position: 'absolute',
        zIndex: 2,
    },

    emptySlotText: {
        fontSize: 14,
        paddingTop: 10,
        color: 'black',
        textAlign: 'center',
    },

    playerCardCloseButton: {
        position: 'absolute',
        right: 21,
        top: 10,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10,
        zIndex: 3,
    },

    playerCardCloseText: {
        color: 'black',
        fontSize: 22,
        fontWeight: 'bold',
        zIndex: 10,
        padding: 5,
    },

});