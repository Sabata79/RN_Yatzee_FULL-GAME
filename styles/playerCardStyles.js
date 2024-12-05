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
        marginBottom: 5,
    },
    playerNameContainer: {
        marginLeft: 0,
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
        backgroundColor: '#fff',
        borderRadius: 10,
        alignItems: 'center',
    },

    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        marginBottom: 5,
        borderWidth: 2,
        borderColor: '#000',
        marginRight: 10,
    },

    avatar: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    scoreRow: {
        width: '100%',
        textAlign: 'center',
    },

    playerCardScoresContainer: {
        marginBottom: 5,
    },

    playerCardScoresTitle: {
        fontSize: 18,
        marginBottom: 10,
    },

    playerCardScoreItem: {
        fontSize: 16,
        marginBottom: 1,
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
        width: '23%',
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#f3f3f3',
        borderRadius: 5,
        position: 'relative',
        flexDirection: 'column',
    },

    playerCardMonthText: {
        fontSize: 16,
        fontWeight: 'normal',
        textAlign: 'center',
        color: '#000000',
        top: 0,
        marginBottom: 10,
        position: 'absolute',
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
    },

});