import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getFirestore, collection, getDocs, DocumentData } from 'firebase/firestore';
import { FIREBASE_DB } from '@/FirebaseConfig'; // Import your Firebase configuration
import { ScrollView } from 'react-native-gesture-handler';

interface Game {
    id: string;
    name: string;
    minPlayers: number;
    maxPlayers: number;
    howToPlay: string;
}

const Page: React.FC<{}> = () => {
    const [games, setGames] = useState<Game[]>([]); // State to store fetched games
    const [expandedGameId, setExpandedGameId] = useState<string | null>(null); // State for active game (if you're using Collapsible)



    useEffect(() => {
        fetchGames();
    }, []);

    const handleGamePress = (gameId: string) => {
        setExpandedGameId((prevExpandedGameId) => {
            if (prevExpandedGameId === gameId) {
                return null; // Collapse the game if it's already expanded
            } else {
                return gameId; // Expand the clicked game
            }
        });
    };

    
    const fetchGames = async () => {
        const db = getFirestore(); // Get Firestore instance
        const gamesCollection = collection(db, "games"); // Reference the "games" collection
        try {
            const querySnapshot = await getDocs(gamesCollection);
            const gamesData: Game[] = []; // Initialize an empty array
            querySnapshot.forEach((doc) => {
                const gameData = doc.data() as Game;
                gamesData.push(gameData);
            });
            setGames(gamesData); // Update state with fetched games
            // console.log("Fetched games:", games); // Or use these games in your UI
            setGames(games);
        } catch (error) {
            console.error("Error fetching games:", error);
        }
    };

    useEffect(() => {
        fetchGames(); // Fetch games on component mount
    }, []);

    return (
        <ScrollView style={styles.mainContainer}>
            {games.map((game: Game, i: number) => ( // Use index for key
                <View key={i} style={{ marginBottom: 15 }}>
                    <TouchableOpacity
                        style={styles.activeGame}
                        onPress={() => handleGamePress(game.id)} // Pass game ID for state update
                    >
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{game.name}</Text>
                    </TouchableOpacity>
                    {/* Conditionally render additional info using activeGame state (if applicable) */}
                    {expandedGameId === game.id && ( // Check if game is active (optional)
                        <View style={{ padding: 15 }}>
                            <Text>Min Players: {game.minPlayers}</Text>
                            <Text>Max Players: {game.maxPlayers}</Text>
                            <Text>How to Play: {game.howToPlay}</Text>
                        </View>
                    )}
                </View>
            ))}
            {/* Replace with your desired navigation solution (e.g., React Navigation) */}
            {/* <Link to="/home" className="btn btn-outline-primary btn-sm m-2">
    Home
    </Link> */}
        </ScrollView>
    );
};

export default Page;

const styles = StyleSheet.create({
    mainContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#F7F2F9',
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    activeGame: {
        backgroundColor: '#2F2D32',
        padding: 15,
        
    },
    activeText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    separator: {
        marginVertical: 30,
        height: 1,
        width: '80%',
    },
});