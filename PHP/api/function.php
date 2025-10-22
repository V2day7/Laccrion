<?php

require_once __DIR__ . '/../../vendor/autoload.php'; // Adjust path if needed
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
require __DIR__ . '/../inc/dbcon.php';

function error422($message)
{
    $data = [
        'status' => 422,
        'message' => $message,
    ];
    header("HTTP/1.0 422 Unprocessable Entity");
    echo json_encode($data);
    exit();
}



function register($userInput) {
    global $con;

    if (isset($userInput['email']) && isset($userInput['password']) && isset($userInput['username'])) {
        $user_id   = 'USER-' . date('Ymd') . substr(uniqid(), -5);
        $email     = trim($userInput['email']);
        $password  = trim($userInput['password']);
        $username  = trim($userInput['username']);

        if (empty($email)) {
            return error422('Email is required');
        } else if (empty($password)) {
            return error422('Password is required');
        } else if (empty($username)) {
            return error422('Username is required');
        } else {
            $hashed = password_hash($password, PASSWORD_BCRYPT);

            $rank_id        = 1;
            $path_id        = NULL;
            $level          = 1;
            $xp             = 0;
            $coins          = 0;
            $prestige_level = 0;

            // Use dummy values for firstname and lastname if your table requires them
            $firstname = NULL;
            $lastname = NULL;

            $query = "INSERT INTO users_tbl 
                (user_id, username, rank_id, firstname, lastname, email, password, path_id, level, xp, coins, prestige_level, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

            $stmt = $con->prepare($query);
            if (!$stmt) {
                return error422("SQL prepare failed: " . $con->error);
            }
            $stmt->bind_param(
                'ssisssssiiii',
                $user_id,
                $username,
                $rank_id,
                $firstname,
                $lastname,
                $email,
                $hashed,
                $path_id,
                $level,
                $xp,
                $coins,
                $prestige_level
            );

            if ($stmt->execute()) {
                $stmt->close();
                return json_encode([
                    'status' => 200,
                    'message' => 'User registered successfully',
                    'user_id' => $user_id,
                    'username' => $username
                ]);
            } else {
                return error422('Registration failed: ' . $stmt->error);
            }
        }
    } else {
        return error422('Invalid input');
    }
}

function login($userInput) {
    global $con;
    $jwt_secret = 'Laccrion'; // Use a strong secret!


    if (isset($userInput['email']) && isset($userInput['password'])) {
        $email = trim($userInput['email']);
        $password = trim($userInput['password']);

        if (empty($email)) {
            return error422('Email is required');
        } else if (empty($password)) {
            return error422('Password is required');
        } else {
            $query = "SELECT user_id, username, password FROM users_tbl WHERE email = ?";
            $stmt = $con->prepare($query);
            if (!$stmt) {
                return error422("SQL prepare failed: " . $con->error);
            }
            $stmt->bind_param('s', $email);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 1) {
                $user = $result->fetch_assoc();
                if (password_verify($password, $user['password'])) {
                    // JWT payload
                    $payload = [
                        'iss' => 'http://localhost',
                        'aud' => 'http://localhost',
                        'iat' => time(),
                        'exp' => time() + 3600,
                        'user_id' => $user['user_id'],
                        'username' => $user['username']
                    ];
                    $jwt = JWT::encode($payload, $jwt_secret, 'HS256');

                    // Set JWT as HTTP-only, Secure cookie
                    setcookie(
                        'logged_user',
                        $jwt,
                        [
                            'expires' => time() + 3600,
                            'path' => '/',
                            'secure' => false,      // Only sent over HTTPS
                            'httponly' => false,    // Not accessible via JS
                            'samesite' => 'Strict'
                        ]
                    );

                    $stmt->close();
                    return json_encode([
                        'status' => 200,
                        'message' => 'Login successful',
                        'user_id' => $user['user_id'],
                        'username' => $user['username'],
                        'token' => $jwt
                        // No need to return token, it's in the cookie
                    ]);
                } else {
                    $stmt->close();
                    return error422('Invalid password');
                }
            } else {
                $stmt->close();
                return error422('User not found');
            }
        }
    } else {
        
        return error422('Invalid input');
    }
}

function pathSelected($userInput) {
    global $con;

    if (isset($userInput['path_id']) && isset($userInput['user_id'])) {
        $path_id = intval($userInput['path_id']);
        $user_id = intval($userInput['user_id']);

        // Validate path_id (1-4)
        if ($path_id < 1 || $path_id > 4) {
            return json_encode([
                'status' => 400,
                'message' => 'Invalid path selected'
            ]);
        }

        // ✅ NEW: Delete any existing pending quests from old path
        $deleteStmt = $con->prepare("
            DELETE FROM user_quests_tbl 
            WHERE user_id = ? 
            AND status = 'pending'
        ");
        $deleteStmt->bind_param("i", $user_id);
        $deleteStmt->execute();
        $deleteStmt->close();

        // Update user's path
        $stmt = $con->prepare("UPDATE users_tbl SET path_id = ? WHERE user_id = ?");
        $stmt->bind_param("ii", $path_id, $user_id);
        
        if ($stmt->execute()) {
            // Get path name
            $stmt2 = $con->prepare("SELECT path_name FROM selected_path_tbl WHERE path_id = ?");
            $stmt2->bind_param("i", $path_id);
            $stmt2->execute();
            $result = $stmt2->get_result();
            $path = $result->fetch_assoc();
            $stmt2->close();

            $stmt->close();

            return json_encode([
                'status' => 200,
                'message' => 'Path selected successfully',
                'path_id' => $path_id,
                'path_name' => $path['path_name']
            ]);
        } else {
            $stmt->close();
            return json_encode([
                'status' => 500,
                'message' => 'Failed to update path'
            ]);
        }
    } else {
        return json_encode([
            'status' => 422,
            'message' => 'Missing required fields: path_id and user_id'
        ]);
    }
}

function ReadDailyQuest($user_id = null) {
    global $con;

    if (!$user_id) {
        return json_encode([
            'status' => 400,
            'message' => 'User ID required'
        ]);
    }

    // Get user's path_id
    $stmt = $con->prepare("SELECT path_id FROM users_tbl WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $user_path_id = $user['path_id'] ?? null;
    $stmt->close();

    // If no path selected, redirect to landing page
    if (is_null($user_path_id)) {
        return json_encode([
            'status' => 403,
            'message' => 'Please select a fitness path first',
            'redirect_to' => '/LandingPage'
        ]);
    }

    $today = date('Y-m-d');

    // ✅ Check if user has quests assigned for today
    $stmt = $con->prepare("
        SELECT COUNT(*) as count 
        FROM user_quests_tbl 
        WHERE user_id = ? 
        AND assigned_date = ?
    ");
    $stmt->bind_param("is", $user_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $assignedCount = $row['count'];
    $stmt->close();

    // ✅ If no quests assigned today, assign 3 new quests
    if ($assignedCount == 0) {
        $assignQuery = "
            SELECT quest_id 
            FROM daily_quests_tbl 
            WHERE path_id = ? OR path_id IS NULL 
            ORDER BY RAND() 
            LIMIT 3
        ";
        $stmt = $con->prepare($assignQuery);
        $stmt->bind_param("i", $user_path_id);
        $stmt->execute();
        $questResult = $stmt->get_result();

        while ($questRow = $questResult->fetch_assoc()) {
            $quest_id = $questRow['quest_id'];
            
            // ✅ Insert with assigned_date
            $insertStmt = $con->prepare("
                INSERT INTO user_quests_tbl (user_id, quest_id, status, assigned_date) 
                VALUES (?, ?, 'pending', ?)
            ");
            $insertStmt->bind_param("iis", $user_id, $quest_id, $today);
            $insertStmt->execute();
            $insertStmt->close();
        }
        $stmt->close();
    }

    // ✅ Fetch ONLY pending quests assigned TODAY
    $query = "
        SELECT 
            dq.quest_id,
            dq.quest_name as QuestText,
            CONCAT('+', dq.xp_reward, ' XP') as QuestXP,
            CONCAT(dq.coin_reward, ' Coins') as QuestCoin,
            dq.description as QuestDesc,
            uq.status,
            uq.assigned_date
        FROM daily_quests_tbl dq
        INNER JOIN user_quests_tbl uq ON dq.quest_id = uq.quest_id
        WHERE uq.user_id = ? 
        AND uq.assigned_date = ?
        AND uq.status = 'pending'
    ";

    $stmt = $con->prepare($query);
    $stmt->bind_param("is", $user_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();

    $quests = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $quests[] = $row;
    }
    $stmt->close();

    // ✅ If all quests completed, return success message
    if (count($quests) === 0) {
        return json_encode([
            'status' => 403,
            'message' => '🎉 All daily quests completed! Come back tomorrow for more rewards!'
        ]);
    }

    return json_encode($quests);
}

/* ============================================
   BONUS REWARDS SYSTEM (WITH PROGRESS TRACKING)
   ============================================ */

/**
 * Read daily bonus rewards for a user (5 per day with progress tracking)
 */
function ReadBonusRewards($user_id = null) {
    global $con;

    if (!$user_id) {
        return json_encode([
            'status' => 400,
            'message' => 'User ID is required'
        ]);
    }

    $today = date('Y-m-d');

    // Check if rewards already assigned today
    $stmt = $con->prepare("
        SELECT COUNT(*) as count 
        FROM user_bonus_rewards_tbl 
        WHERE user_id = ? AND assigned_date = ?
    ");
    $stmt->bind_param("is", $user_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $assignedCount = $row['count'];
    $stmt->close();

    // If no rewards assigned today, assign 5 new ones
    if ($assignedCount == 0) {
        assignDailyBonusRewards($user_id, $today);
    }

    // Update progress for auto-tracked rewards
    updateBonusProgress($user_id, $today);

    // Fetch pending rewards with progress
    $query = "
        SELECT 
            br.bonus_id,
            br.reward_name,
            br.description,
            br.xp_reward,
            br.coin_reward,
            br.rarity,
            br.tracking_type,
            ubr.status,
            ubr.current_progress,
            ubr.required_progress
        FROM user_bonus_rewards_tbl ubr
        JOIN bonus_rewards_tbl br ON ubr.bonus_id = br.bonus_id
        WHERE ubr.user_id = ? 
        AND ubr.assigned_date = ?
        AND ubr.status = 'pending'
        ORDER BY 
            FIELD(br.rarity, 'legendary', 'epic', 'rare', 'common')
    ";

    $stmt = $con->prepare($query);
    $stmt->bind_param("is", $user_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();

    $bonusRewards = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $bonusRewards[] = $row;
    }
    $stmt->close();

    if (count($bonusRewards) === 0) {
        return json_encode([
            'status' => 403,
            'message' => '🎉 All bonus rewards completed! Come back tomorrow!'
        ]);
    }

    return json_encode($bonusRewards);
}

/**
 * Assign 5 random bonus rewards based on rarity
 */
function assignDailyBonusRewards($user_id, $today) {
    global $con;

    // Get user level
    $stmt = $con->prepare("SELECT level FROM users_tbl WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $userLevel = $user['level'] ?? 1;
    $stmt->close();

    $selectedRewards = [];

    // Rarity pool: 3 common, 1 rare, 1 epic (3% chance for legendary)
    $rarityPool = [
        'common' => 3,
        'rare' => 1,
        'epic' => 1
    ];

    // 3% chance for legendary
    if (rand(1, 100) <= 3) {
        $rarityPool['legendary'] = 1;
        $rarityPool['epic'] = 0;
    }

    foreach ($rarityPool as $rarity => $count) {
        if ($count == 0) continue;

        $whereNotIn = count($selectedRewards) > 0 
            ? "AND bonus_id NOT IN (" . implode(',', array_fill(0, count($selectedRewards), '?')) . ")"
            : "";

        $stmt = $con->prepare("
            SELECT bonus_id, required_count
            FROM bonus_rewards_tbl 
            WHERE rarity = ? 
            AND min_level <= ? 
            AND is_active = 1
            $whereNotIn
            ORDER BY RAND() 
            LIMIT ?
        ");

        $types = "si" . str_repeat('i', count($selectedRewards)) . "i";
        $params = [$rarity, $userLevel];
        $params = array_merge($params, $selectedRewards);
        $params[] = $count;

        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();

        while ($row = $result->fetch_assoc()) {
            $bonusId = $row['bonus_id'];
            $requiredCount = $row['required_count'];
            
            // Insert with required_progress
            $insertStmt = $con->prepare("
                INSERT INTO user_bonus_rewards_tbl 
                (user_id, bonus_id, assigned_date, current_progress, required_progress) 
                VALUES (?, ?, ?, 0, ?)
            ");
            $insertStmt->bind_param("iisi", $user_id, $bonusId, $today, $requiredCount);
            $insertStmt->execute();
            $insertStmt->close();
            
            $selectedRewards[] = $bonusId;
        }
        $stmt->close();
    }
}

/**
 * Update progress for auto-tracked bonuses
 */
function updateBonusProgress($user_id, $today) {
    global $con;
    
    // Get all pending auto-tracked bonuses
    $stmt = $con->prepare("
        SELECT 
            ubr.user_bonus_id,
            ubr.bonus_id,
            ubr.current_progress,
            ubr.required_progress,
            br.tracking_condition,
            br.xp_reward,
            br.coin_reward,
            br.reward_name,
            br.rarity
        FROM user_bonus_rewards_tbl ubr
        JOIN bonus_rewards_tbl br ON ubr.bonus_id = br.bonus_id
        WHERE ubr.user_id = ?
        AND ubr.assigned_date = ?
        AND ubr.status = 'pending'
        AND br.tracking_type = 'auto'
    ");
    
    $stmt->bind_param("is", $user_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($bonus = $result->fetch_assoc()) {
        $actualProgress = getCurrentProgress($user_id, $bonus['tracking_condition'], $today);
        
        // Update progress
        if ($actualProgress > $bonus['current_progress']) {
            $updateStmt = $con->prepare("
                UPDATE user_bonus_rewards_tbl 
                SET current_progress = ?
                WHERE user_bonus_id = ?
            ");
            $updateStmt->bind_param("ii", $actualProgress, $bonus['user_bonus_id']);
            $updateStmt->execute();
            $updateStmt->close();
        }
        
        // Auto-complete if done
        if ($actualProgress >= $bonus['required_progress']) {
            $completeStmt = $con->prepare("
                UPDATE user_bonus_rewards_tbl 
                SET status = 'completed', completed_at = NOW()
                WHERE user_bonus_id = ?
            ");
            $completeStmt->bind_param("i", $bonus['user_bonus_id']);
            $completeStmt->execute();
            $completeStmt->close();
            
            // Award XP/Coins
            $rewardStmt = $con->prepare("
                UPDATE users_tbl 
                SET xp = xp + ?, coins = coins + ?
                WHERE user_id = ?
            ");
            $rewardStmt->bind_param("iii", $bonus['xp_reward'], $bonus['coin_reward'], $user_id);
            $rewardStmt->execute();
            $rewardStmt->close();
        }
    }
    
    $stmt->close();
}

/**
 * Get current progress for tracking condition
 */
function getCurrentProgress($user_id, $condition, $date) {
    global $con;
    
    // Parse condition (e.g., "workout_count:2" or "quest_count:3,workout_count:3")
    $rules = explode(',', $condition);
    $totalProgress = 0;
    
    foreach ($rules as $rule) {
        $parts = explode(':', $rule);
        $type = trim($parts[0]);
        
        switch ($type) {
            case 'workout_count':
                $stmt = $con->prepare("
                    SELECT COUNT(*) as count 
                    FROM user_workout_programs_tbl 
                    WHERE user_id = ?
                    AND DATE(completed_at) = ?
                    AND status = 'completed'
                ");
                $stmt->bind_param("is", $user_id, $date);
                $stmt->execute();
                $result = $stmt->get_result();
                $row = $result->fetch_assoc();
                $stmt->close();
                $totalProgress += $row['count'];
                break;
                
            case 'quest_count':
                $stmt = $con->prepare("
                    SELECT COUNT(*) as count 
                    FROM user_quests_tbl 
                    WHERE user_id = ?
                    AND completed_date = ?
                    AND status = 'completed'
                ");
                $stmt->bind_param("is", $user_id, $date);
                $stmt->execute();
                $result = $stmt->get_result();
                $row = $result->fetch_assoc();
                $stmt->close();
                $totalProgress += $row['count'];
                break;
                
            case 'consecutive_days':
                $requiredDays = isset($parts[1]) ? intval(trim($parts[1])) : 7;
                $stmt = $con->prepare("
                    SELECT COUNT(DISTINCT completed_date) as count
                    FROM user_quests_tbl
                    WHERE user_id = ?
                    AND completed_date >= DATE_SUB(?, INTERVAL ? DAY)
                    AND status = 'completed'
                ");
                $stmt->bind_param("isi", $user_id, $date, $requiredDays);
                $stmt->execute();
                $result = $stmt->get_result();
                $row = $result->fetch_assoc();
                $stmt->close();
                $totalProgress = $row['count'];
                break;
        }
    }
    
    return $totalProgress;
}

/**
 * Complete a manual bonus reward
 */
function completeBonusReward($user_id, $bonus_id) {
    global $con;

    if (!$user_id || !$bonus_id) {
        return [
            'status' => 400,
            'message' => 'User ID and Bonus ID required'
        ];
    }

    $today = date('Y-m-d');

    // Check if exists and pending
    $stmt = $con->prepare("
        SELECT ubr.user_bonus_id, br.xp_reward, br.coin_reward, br.reward_name, br.rarity
        FROM user_bonus_rewards_tbl ubr
        JOIN bonus_rewards_tbl br ON ubr.bonus_id = br.bonus_id
        WHERE ubr.user_id = ?
        AND ubr.bonus_id = ?
        AND ubr.assigned_date = ?
        AND ubr.status = 'pending'
    ");
    $stmt->bind_param("iis", $user_id, $bonus_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        return [
            'status' => 404,
            'message' => 'Bonus not found or already completed'
        ];
    }

    $bonusData = $result->fetch_assoc();
    $stmt->close();

    // Award XP/Coins
    $stmt = $con->prepare("
        UPDATE users_tbl 
        SET xp = xp + ?, coins = coins + ?
        WHERE user_id = ?
    ");
    $stmt->bind_param("iii", $bonusData['xp_reward'], $bonusData['coin_reward'], $user_id);
    $stmt->execute();
    $stmt->close();

    // Mark completed
    $stmt = $con->prepare("
        UPDATE user_bonus_rewards_tbl 
        SET status = 'completed', completed_at = NOW()
        WHERE user_bonus_id = ?
    ");
    $stmt->bind_param("i", $bonusData['user_bonus_id']);
    $stmt->execute();
    $stmt->close();

    $levelUp = checkAndLevelUp($user_id);
    $stats = fetchPlayerStats($user_id);

    return [
        'status' => 200,
        'message' => 'Bonus completed!',
        'rewards' => [
            'xp' => $bonusData['xp_reward'],
            'coins' => $bonusData['coin_reward']
        ],
        'stats' => $stats,
        'level_up' => $levelUp,
        'reward_name' => $bonusData['reward_name'],
        'rarity' => $bonusData['rarity']
    ];
}

/* ---------------- LEVEL UP LOGIC ---------------- */

function fetchPlayerStats($user_id) {
    global $con;

    // ✅ Join with selected_path_tbl to get path name
    $query = "SELECT 
                u.level, 
                u.xp, 
                u.coins, 
                u.rank_id,
                u.path_id,
                r.rank_name,
                sp.path_name
              FROM users_tbl u
              LEFT JOIN ranks_tbl r ON u.rank_id = r.rank_id
              LEFT JOIN selected_path_tbl sp ON u.path_id = sp.path_id
              WHERE u.user_id = ?";

    $stmt = $con->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $userData = $result->fetch_assoc();
    $stmt->close();

    if (!$userData) {
        return [
            'status' => 404,
            'message' => 'User not found'
        ];
    }

    $currentLevel = $userData['level'];
    $currentXP = $userData['xp'];
    $nextLevelXP = getXPForNextLevel($currentLevel);

    return [
        'status' => 200,
        'data' => [
            'level' => $currentLevel,
            'xp' => $currentXP,
            'next_level_xp' => $nextLevelXP,
            'rank' => $userData['rank_name'] ?? 'Rookie',
            'coin' => $userData['coins'] ?? 0,
            'streak' => 0, // TODO: Implement streak logic
            'path_id' => $userData['path_id'],
            'path_name' => $userData['path_name'] ?? 'No Path Selected'
        ]
    ];
}


// Add this function to calculate XP requirement for next level
function getXPForNextLevel($currentLevel) {
    // Option 1: Exponential formula (1.5x multiplier)
    $baseXP = 100;
    $multiplier = 1.5;
    return (int) ($baseXP * pow($multiplier, $currentLevel));
    
    // Option 2: Polynomial formula
    // return (int) (100 * pow($currentLevel, 2));
    
    // Option 3: Linear formula
    // return 100 + ($currentLevel * 50);
}

// Add function to handle level-up logic

function checkAndLevelUp($user_id) {
    global $con;
    
    // Get current stats
    $stmt = $con->prepare("SELECT level, xp FROM users_tbl WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();
    
    if (!$user) return ['leveled_up' => false];
    
    $currentLevel = $user['level'];
    $currentXP = $user['xp'];
    $requiredXP = getXPForNextLevel($currentLevel);
    
    $leveledUp = false;
    $levelsGained = 0;
    
    // Handle multiple level ups
    while ($currentXP >= $requiredXP) {
        $currentLevel++;
        $currentXP -= $requiredXP;
        $requiredXP = getXPForNextLevel($currentLevel);
        $levelsGained++;
        $leveledUp = true;
    }
    
    if ($leveledUp) {
        // Update level and remaining XP
        $stmt = $con->prepare("UPDATE users_tbl SET level = ?, xp = ? WHERE user_id = ?");
        $stmt->bind_param("iii", $currentLevel, $currentXP, $user_id);
        $stmt->execute();
        $stmt->close();
        
        // Update rank based on new level
        updateRank($user_id, $currentLevel);
        
        return [
            'leveled_up' => true,
            'new_level' => $currentLevel,
            'levels_gained' => $levelsGained,
            'remaining_xp' => $currentXP
        ];
    }
    
    return ['leveled_up' => false];
}


// function checkAndLevelUp($user_id) {
//     global $con;
    
//     // Get current stats
//     $stmt = $con->prepare("SELECT level, xp FROM users_tbl WHERE user_id = ?");
//     $stmt->bind_param("i", $user_id);
//     $stmt->execute();
//     $result = $stmt->get_result();
//     $user = $result->fetch_assoc();
//     $stmt->close();
    
//     if (!$user) return false;
    
//     $currentLevel = $user['level'];
//     $currentXP = $user['xp'];
//     $requiredXP = getXPForNextLevel($currentLevel);
    
//     // Check if level up
//     if ($currentXP >= $requiredXP) {
//         $newLevel = $currentLevel + 1;
//         $remainingXP = $currentXP - $requiredXP;
        
//         // Update level and carry over remaining XP
//         $stmt = $con->prepare("UPDATE users_tbl SET level = ?, xp = ? WHERE user_id = ?");
//         $stmt->bind_param("iii", $newLevel, $remainingXP, $user_id);
//         $stmt->execute();
//         $stmt->close();
        
//         // Check if rank should also update
//         updateRank($user_id, $newLevel);
        
//         return [
//             'leveled_up' => true,
//             'new_level' => $newLevel,
//             'remaining_xp' => $remainingXP
//         ];
//     }
    
//     return ['leveled_up' => false];
// }

// Update rank based on level




function updateRank($user_id, $level) {
    global $con;
    
    // Get rank based on level from ranks_tbl
    $stmt = $con->prepare("SELECT rank_id FROM ranks_tbl WHERE ? BETWEEN min_level AND max_level");
    $stmt->bind_param("i", $level);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $rankId = $row['rank_id'];
        $stmt->close();
        
        // Update user's rank
        $stmt = $con->prepare("UPDATE users_tbl SET rank_id = ? WHERE user_id = ?");
        $stmt->bind_param("ii", $rankId, $user_id);
        $stmt->execute();
        $stmt->close();
    }
}

/* ---------------- WORKOUTS HELPERS ---------------- */


/* Generate stable api_workout_id (API-Ninjas has no id) */
function makeApiId($workout) {
    // stable hash of name + muscle + equipment + difficulty
    $s = ($workout['name'] ?? '') . '|' . ($workout['muscle'] ?? '') . '|' . ($workout['equipment'] ?? '') . '|' . ($workout['difficulty'] ?? '');
    return md5($s);
}

/* Save a single workout to workout_master_tbl if not exists and return workout_id */
function saveWorkoutFromAPI($workout) {
    global $con;

    $api_id = makeApiId($workout);
    // quick check
    $q = "SELECT workout_id FROM workout_master_tbl WHERE api_workout_id = ?";
    $stmt = $con->prepare($q);
    $stmt->bind_param("s", $api_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) return (int)$row['workout_id'];

    // insert
    $sql = "INSERT INTO workout_master_tbl (workoutType, api_workout_id, workout_name, muscle, equipment, difficulty, instructions, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
    $stmt = $con->prepare($sql);
    $type = $workout['type'] ?? null;
    $name = $workout['name'] ?? null;
    $muscle = $workout['muscle'] ?? null;
    $equipment = $workout['equipment'] ?? null;
    $difficulty = $workout['difficulty'] ?? null;
    $instructions = $workout['instructions'] ?? null;
    $stmt->bind_param("sssssss", $type, $api_id, $name, $muscle, $equipment, $difficulty, $instructions);
    $ok = $stmt->execute();
    if (!$ok) {
        // ignore duplicate key race or return false
        return false;
    }
    return $stmt->insert_id;
}

/* Call API-Ninjas (wrap HTTP call) */
function callApiNinjas($params = []) {
    // Read API key from environment or config file
    $apiKey = 'AnXAXQ7YdAo62gVTbA6DfA==QJAyhPTtXmzpKrDU'; // set in your env
    if (!$apiKey) return ['error' => 'API key missing'];

    // Build query (e.g. https://api.api-ninjas.com/v1/exercises?muscle=biceps&type=strength)
    $qs = http_build_query($params);
    $url = "https://api.api-ninjas.com/v1/exercises";
    if ($qs) $url .= "?$qs";

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-Api-Key: $apiKey"]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $res = curl_exec($ch);
    $err = curl_error($ch);
    $http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($err || $http_status !== 200) {
        return ['error' => $err ?: "HTTP status $http_status"];
    }

    $data = json_decode($res, true);
    if (json_last_error() !== JSON_ERROR_NONE) return ['error' => 'Invalid JSON'];

    return $data;
}

/* Main caching function with path filtering */
function getWorkoutsCached($filters = [], $apiLimit = 1000) {
    global $con;
    
    // Build WHERE clause from filters
    $where = [];
    $params = [];
    $types = "";

    if (!empty($filters['muscle'])) { 
        $where[] = "muscle = ?"; 
        $params[] = $filters['muscle']; 
        $types .= "s"; 
    }
    if (!empty($filters['difficulty'])) { 
        $where[] = "difficulty = ?"; 
        $params[] = $filters['difficulty']; 
        $types .= "s"; 
    }
    if (!empty($filters['equipment'])) { 
        $where[] = "equipment = ?"; 
        $params[] = $filters['equipment']; 
        $types .= "s"; 
    }
    if (!empty($filters['search'])) { 
        $where[] = "workout_name LIKE ?"; 
        $params[] = '%' . $filters['search'] . '%'; 
        $types .= "s"; 
    }

    // ✅ Filter by workout types (path-specific) - REQUIRED
    if (!empty($filters['path_types']) && is_array($filters['path_types'])) {
        $placeholders = implode(',', array_fill(0, count($filters['path_types']), '?'));
        $where[] = "workoutType IN ($placeholders)";
        foreach ($filters['path_types'] as $type) {
            $params[] = $type;
            $types .= "s";
        }
    }

    $where_sql = $where ? "WHERE " . implode(" AND ", $where) : "";

    // Pagination
    $limit = isset($filters['limit']) ? (int)$filters['limit'] : 20;
    $offset = isset($filters['offset']) ? (int)$filters['offset'] : 0;

    $sql = "SELECT workout_id, workoutType, api_workout_id, workout_name, muscle, equipment, difficulty, instructions 
            FROM workout_master_tbl $where_sql 
            ORDER BY RAND()
            LIMIT ? OFFSET ?";
    
    $types2 = $types . "ii";
    $params2 = $params;
    $params2[] = $limit; 
    $params2[] = $offset;

    $stmt = $con->prepare($sql);
    if ($types2) {
        $stmt->bind_param($types2, ...$params2);
    }
    $stmt->execute();
    $res = $stmt->get_result();
    $rows = $res->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // ✅ If DB has data -> return cached rows
    if (count($rows) > 0) {
        return $rows;
    }

    // ✅ DB is empty -> Fetch from API
    if (!canCallApi($apiLimit)) {
        return ['error' => 'API quota exhausted for this month'];
    }

    // ✅ Fetch multiple types from API to populate DB
    $allWorkouts = [];
    
    if (!empty($filters['path_types'])) {
        // Fetch workouts for each type in the path
        foreach ($filters['path_types'] as $type) {
            $apiParams = ['type' => $type];
            
            // Add optional filters
            if (!empty($filters['muscle'])) $apiParams['muscle'] = $filters['muscle'];
            if (!empty($filters['difficulty'])) $apiParams['difficulty'] = $filters['difficulty'];
            if (!empty($filters['equipment'])) $apiParams['equipment'] = $filters['equipment'];
            
            $apiData = callApiNinjas($apiParams);
            
            if (!isset($apiData['error'])) {
                $allWorkouts = array_merge($allWorkouts, $apiData);
                incrementApiUsage(1); // Count each API call
            }
            
            // Limit to 3 API calls per request to avoid quota issues
            if (count($allWorkouts) >= 60) break;
        }
    } else {
        // No path types, fetch generic workouts
        $apiParams = [];
        if (!empty($filters['muscle'])) $apiParams['muscle'] = $filters['muscle'];
        if (!empty($filters['difficulty'])) $apiParams['difficulty'] = $filters['difficulty'];
        if (!empty($filters['equipment'])) $apiParams['equipment'] = $filters['equipment'];
        
        $allWorkouts = callApiNinjas($apiParams);
        incrementApiUsage(1);
    }

    if (isset($allWorkouts['error'])) {
        return ['error' => $allWorkouts['error']];
    }

    // Save workouts to DB
    $saved = [];
    foreach ($allWorkouts as $wk) {
        $id = saveWorkoutFromAPI($wk);
        if ($id) {
            $saved[] = [
                'workout_id' => $id,
                'workoutType' => $wk['type'] ?? null,
                'workout_name' => $wk['name'] ?? null,
                'muscle' => $wk['muscle'] ?? null,
                'equipment' => $wk['equipment'] ?? null,
                'difficulty' => $wk['difficulty'] ?? null,
                'instructions' => $wk['instructions'] ?? null
            ];
        }
    }
    
    // Apply limit to saved results
    return array_slice($saved, 0, $limit);
}

/* ---------------- API usage helpers ---------------- */

// ensure $con is available (mysqli)
function getMonthYear() {
    return date('Y-m');
}

function getApiUsageCount() {
    global $con;
    $m = getMonthYear();
    $stmt = $con->prepare("SELECT call_count FROM api_usage_tbl WHERE month_year = ?");
    $stmt->bind_param("s", $m);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($r = $res->fetch_assoc()) return (int)$r['call_count'];
    // create row if not exist
    $stmt = $con->prepare("INSERT IGNORE INTO api_usage_tbl (month_year, call_count) VALUES (?, 0)");
    $stmt->bind_param("s", $m); $stmt->execute();
    return 0;
}

function incrementApiUsage($count = 1) {
    global $con;
    $m = getMonthYear();
    $stmt = $con->prepare("INSERT INTO api_usage_tbl (month_year, call_count) VALUES (?, ?) ON DUPLICATE KEY UPDATE call_count = call_count + ?");
    $stmt->bind_param("sii", $m, $count, $count);
    return $stmt->execute();
}

function canCallApi($limit = 1000) {
    $used = getApiUsageCount();
    return $used < $limit;
}



//  ---------------- MEALS HELPERS ---------------- 

/**
 * Main meal caching function with pagination
 * - Checks DB first
 * - If empty or nutrition missing, calls CalorieNinjas API
 * - Saves to cache
 */
/* ---------------- MEALS CACHING FUNCTION (ENHANCED) ---------------- */

/**
 * Automatically fetch meals from API when DB is empty
 */
function fetchAndSaveMealsFromAPI() {
    global $con;
    
    // ✅ Predefined healthy meal list
    $predefinedMeals = [
        'Grilled Chicken Breast',
        'Salmon with Broccoli', 
        'Protein Smoothie',
        'Greek Yogurt with Berries',
        'Quinoa Salad',
        'Egg White Omelette',
        'Tuna Salad',
        'Sweet Potato with Chicken',
        'Protein Pancakes',
        'Beef Stir Fry',
        'Caesar Salad',
        'Turkey Wrap',
        'Shrimp Fried Rice',
        'Veggie Burger',
        'Grilled Fish Tacos',
        'Chicken Teriyaki',
        'Spaghetti Bolognese',
        'Grilled Steak',
        'Vegetable Curry',
        'Protein Oatmeal'
    ];
    
    $results = [];
    $saved_count = 0;
    
    foreach ($predefinedMeals as $mealName) {
        // ✅ Check if meal already exists
        $stmt = $con->prepare("SELECT meal_id FROM meals_tbl WHERE name = ?");
        $stmt->bind_param("s", $mealName);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $stmt->close();
            continue; // Skip if already exists
        }
        $stmt->close();
        
        // ✅ Check API quota
        if (!canCallApi(1000)) {
            $results[] = [
                'meal' => $mealName, 
                'status' => 'API limit reached',
                'error' => true
            ];
            break;
        }
        
        // ✅ Call API to get nutrition
        $apiData = callCalorieNinjas($mealName);
        
        if (isset($apiData['error']) || empty($apiData['items'])) {
            $results[] = [
                'meal' => $mealName, 
                'status' => 'API error: ' . ($apiData['error'] ?? 'No data'),
                'error' => true
            ];
            continue;
        }
        
        // ✅ Save meal to DB
        $price = rand(30, 80); // Random price between 30-80 coins
        $imageUrl = 'images/' . strtolower(str_replace(' ', '_', $mealName)) . '.jpg';
        
        $meal_id = saveMealFromAPI($mealName, '', $price, $imageUrl);
            
        if ($meal_id) {
            // ✅ Save nutrition to cache
            $nutrition = aggregateNutrition($apiData);
            saveNutritionToCache($meal_id, $nutrition);
            incrementApiUsage(1);
            
            $results[] = [
                'meal' => $mealName, 
                'meal_id' => $meal_id,
                'calories' => $nutrition['calories'],
                'protein' => $nutrition['protein'],
                'carbs' => $nutrition['carbs'],
                'fat' => $nutrition['fat'],
                'status' => 'success',
                'error' => false
            ];
            $saved_count++;
        } else {
            $results[] = [
                'meal' => $mealName, 
                'status' => 'DB save failed',
                'error' => true
            ];
        }
        
        // ✅ Stop after 15 successful saves to avoid long initial load
        if ($saved_count >= 15) break;
    }
    
    return [
        'total_saved' => $saved_count,
        'results' => $results
    ];
}

/**
 * Main meal caching function with auto-populate and pagination
 */

/**
 * Fetch RANDOM meals from API (not predefined list)
 */
/**
 * ✅ UPDATED: Fetch meals with 3-layer image fallback
 */
function fetchMoreMealsFromAPI($count = 10) {
    global $con;
    
    $proteins = ['Chicken', 'Beef', 'Salmon', 'Tuna', 'Turkey', 'Shrimp', 'Tofu', 'Pork'];
    $cookingMethods = ['Grilled', 'Baked', 'Fried', 'Steamed', 'Roasted'];
    $sides = ['with Rice', 'with Vegetables', 'with Quinoa', 'with Pasta', 'with Salad'];
    $completeMeals = ['Caesar Salad', 'Greek Salad', 'Protein Smoothie', 'Egg White Omelette', 'Veggie Burger'];
    
    $results = [];
    $saved_count = 0;
    $attempts = 0;
    $max_attempts = $count * 3;
    $api_calls = 0;
    
    // Get existing meals
    $existingMeals = [];
    $stmt = $con->prepare("SELECT LOWER(name) as name FROM meals_tbl");
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $existingMeals[] = $row['name'];
    }
    $stmt->close();
    
    while ($saved_count < $count && $attempts < $max_attempts) {
        $attempts++;
        
        if (!canCallApi(1000)) {
            error_log("⚠️ API quota limit reached");
            break;
        }
        
        $mealName = generateRandomMealName($proteins, $cookingMethods, $sides, $completeMeals);
        
        if (in_array(strtolower($mealName), $existingMeals)) {
            continue;
        }
        
        // ✅ Step 1: Fetch nutrition
        $apiData = callCalorieNinjas($mealName);
        $api_calls++;
        
        if (isset($apiData['error']) || empty($apiData['items'])) {
            continue;
        }
        
        // ✅ Step 2: Fetch image with 3-layer fallback
        $imageUrl = fetchFoodImage($mealName);
        
        $price = rand(30, 80);
        
        // ✅ Step 3: Save meal with image
        $meal_id = saveMealFromAPI($mealName, '', $price, $imageUrl);
        
        if ($meal_id) {
            $nutrition = aggregateNutrition($apiData);
            saveNutritionToCache($meal_id, $nutrition);
            incrementApiUsage(1);
            
            $existingMeals[] = strtolower($mealName);
            
            $results[] = [
                'meal_id' => $meal_id,
                'name' => $mealName,
                'price' => $price,
                'image_url' => $imageUrl,
                'calories' => $nutrition['calories'],
                'protein' => $nutrition['protein'],
                'carbs' => $nutrition['carbs'],
                'fat' => $nutrition['fat'],
                'is_cached' => 1
            ];
            $saved_count++;
            
            error_log("✅ Saved: $mealName with image");
        }
    }
    
    return [
        'saved_count' => $saved_count,
        'message' => $saved_count > 0 
            ? "Successfully fetched $saved_count meals with images" 
            : "Could not fetch new meals",
        'meals' => $results,
        'api_calls_used' => $api_calls,
        'attempts_made' => $attempts
    ];
}

/**
 * Generate random meal name
 */
function generateRandomMealName($proteins, $cookingMethods, $sides, $completeMeals) {
    // 40% chance to use complete meal, 60% chance to generate combination
    if (rand(1, 10) <= 4) {
        // Return random complete meal
        return ucwords($completeMeals[array_rand($completeMeals)]);
    } else {
        // Generate combination
        $protein = $proteins[array_rand($proteins)];
        $method = $cookingMethods[array_rand($cookingMethods)];
        
        // 70% chance to add a side
        if (rand(1, 10) <= 7) {
            $side = $sides[array_rand($sides)];
            return ucwords("$method $protein $side");
        } else {
            return ucwords("$method $protein");
        }
    }
}
function getMealsCached($filters = []) {
    global $con;
    
    // ✅ Check if database is empty
    $countResult = $con->query("SELECT COUNT(*) as total FROM meals_tbl");
    $totalMeals = $countResult->fetch_assoc()['total'];
    
    // ✅ If empty, auto-fetch from API
    if ($totalMeals == 0) {
        $apiResults = fetchAndSaveMealsFromAPI();
        
        // Refresh total count
        $countResult = $con->query("SELECT COUNT(*) as total FROM meals_tbl");
        $totalMeals = $countResult->fetch_assoc()['total'];
    }
    
    // ✅ Now proceed with normal pagination
    $limit = isset($filters['limit']) ? (int)$filters['limit'] : 10;
    $offset = isset($filters['offset']) ? (int)$filters['offset'] : 0;
    $search = isset($filters['search']) ? trim($filters['search']) : '';
    $user_id = $filters['user_id'] ?? null; 
    
    // Build WHERE clause
    $where = "";
    $params = [];
    $types = "";
    
    if ($search) {
        $where = "WHERE m.name LIKE ?";
        $params[] = "%$search%";
        $types = "s";
    }
    
    // Count total (may have changed after API fetch)
    $countSql = "SELECT COUNT(*) as total FROM meals_tbl m $where";
    if ($types) {
        $stmt = $con->prepare($countSql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $total = $result->fetch_assoc()['total'];
        $stmt->close();
    } else {
        $result = $con->query($countSql);
        $total = $result->fetch_assoc()['total'];
    }
    
      
    // ✅ Fetch meals with nutrition AND ownership status
    $sql = "
        SELECT 
            m.meal_id, 
            m.name, 
            m.price_coins, 
            m.image_url,
            n.calories, 
            n.protein, 
            n.carbs, 
            n.fat
            " . ($user_id ? ", IF(ui.inventory_id IS NOT NULL, 1, 0) as is_owned" : ", 0 as is_owned") . "
        FROM meals_tbl m
        LEFT JOIN meal_nutrition_tbl n ON m.meal_id = n.meal_id
        " . ($user_id ? "LEFT JOIN user_inventory_tbl ui ON m.meal_id = ui.meal_id AND ui.user_id = $user_id" : "") . "
        $where
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
    ";
    
    $types2 = $types . "ii";
    $params2 = $params;
    $params2[] = $limit;
    $params2[] = $offset;
    
    $stmt = $con->prepare($sql);
    if ($types2) {
        $stmt->bind_param($types2, ...$params2);
    }
    $stmt->execute();
    $res = $stmt->get_result();
    
    $meals = [];
    while ($row = $res->fetch_assoc()) {
        // ✅ If nutrition is missing, fetch from API (lazy loading)
        if ($row['calories'] === null && canCallApi(1000)) {
            $apiData = callCalorieNinjas($row['name']);
            
            if (!isset($apiData['error']) && !empty($apiData['items'])) {
                $nutrition = aggregateNutrition($apiData);
                saveNutritionToCache($row['meal_id'], $nutrition);
                incrementApiUsage(1);
                
                // Update row with fresh data
                $row['calories'] = $nutrition['calories'];
                $row['protein'] = $nutrition['protein'];
                $row['carbs'] = $nutrition['carbs'];
                $row['fat'] = $nutrition['fat'];
            }
        }
        
        $meals[] = [
            "meal_id"   => (int)$row['meal_id'],
            "name"      => $row['name'],
            "price"     => (int)$row['price_coins'],
            "image_url" => $row['image_url'],
            "calories"  => $row['calories'] !== null ? (float)$row['calories'] : null,
            "protein"   => $row['protein'] !== null ? (float)$row['protein'] : null,
            "carbs"     => $row['carbs'] !== null ? (float)$row['carbs'] : null,
            "fat"       => $row['fat'] !== null ? (float)$row['fat'] : null,
            "is_owned"  => (int)($row['is_owned'] ?? 0), // ✅ NEW: Ownership status
            "is_cached" => $row['calories'] !== null ? 1 : 0
        ];
    }
    $stmt->close();
    
    return [
        'meals' => $meals,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset,
        'has_more' => ($offset + $limit) < $total
    ];
}
//  Generate stable api_meal_id

function makeApiMealId($name, $ingredients = '') {
    $n = mb_strtolower(trim($name), 'UTF-8');
    $ing = trim(preg_replace('/\s+/', ' ', $ingredients));
    return md5($n . '|' . $ing);
}

//   Save a meal into meals_tbl if not exists.
//   Returns meal_id.

function saveMealFromAPI($name, $ingredients = '', $price_coins = 0, $image_url = null) {
    global $con;
    $api_id = makeApiMealId($name, $ingredients);

    // quick check
    $stmt = $con->prepare("SELECT meal_id FROM meals_tbl WHERE api_meal_id = ?");
    $stmt->bind_param("s", $api_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($r = $res->fetch_assoc()) {
        $stmt->close();
        return (int)$r['meal_id'];
    }
    $stmt->close();

    // insert new
    $stmt = $con->prepare("INSERT INTO meals_tbl (api_meal_id, name, price_coins, image_url, created_at) VALUES (?, ?, ?, ?, NOW())");
    $stmt->bind_param("ssis", $api_id, $name, $price_coins, $image_url);
    $ok = $stmt->execute();
    if (!$ok) {
        // Handle duplicate race
        if ($con->errno === 1062) {
            $stmt->close();
            $stmt2 = $con->prepare("SELECT meal_id FROM meals_tbl WHERE api_meal_id = ?");
            $stmt2->bind_param("s", $api_id);
            $stmt2->execute();
            $res2 = $stmt2->get_result();
            if ($r2 = $res2->fetch_assoc()) {
                $stmt2->close();
                return (int)$r2['meal_id'];
            }
            $stmt2->close();
        }
        $stmt->close();
        return false;
    }
    $id = $stmt->insert_id;
    $stmt->close();
    return $id;
}

//   Call CalorieNinjas API for nutrition data
function callCalorieNinjas($query) {
    $apiKey = getenv('CALORIE_NINJAS_KEY') ?: 'ks9tnmW+i+6ELzRrrFQrCg==6napDaHvGOQaHwR7';
    

    if (!$apiKey) return ['error' => 'API key missing'];

    $url = "https://api.calorieninjas.com/v1/nutrition?query=" . urlencode($query);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-Api-Key: $apiKey"]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $res = curl_exec($ch);
    $err = curl_error($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($err || $status !== 200) {
        return ['error' => $err ?: "HTTP status $status"];
    }
    $data = json_decode($res, true);
    if (json_last_error() !== JSON_ERROR_NONE) return ['error' => 'Invalid JSON'];
    return $data;
}


//  Aggregate nutrition totals

function aggregateNutrition($apiData) {
    if (isset($apiData['error'])) return $apiData;

    $items = $apiData['items'] ?? (is_array($apiData) ? $apiData : []);
    $totals = ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0];
    foreach ($items as $it) {
        $totals['calories'] += floatval($it['calories'] ?? 0);
        $totals['protein']  += floatval($it['protein_g'] ?? $it['protein_total_g'] ?? 0);
        $totals['carbs']    += floatval($it['carbohydrates_total_g'] ?? 0);
        $totals['fat']      += floatval($it['fat_total_g'] ?? 0);
    }
    foreach ($totals as $k=>$v) $totals[$k] = round($v,2);
    return $totals;
}


//   Get cached nutrition

function getNutritionFromCache($meal_id) {
    global $con;
    $stmt = $con->prepare("SELECT calories, protein, carbs, fat, last_updated 
                           FROM meal_nutrition_tbl 
                           WHERE meal_id = ?");
    $stmt->bind_param("i", $meal_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    $stmt->close();
    return $row ?: null;
}

function saveNutritionToCache($meal_id, $totals) {
    global $con;
    $stmt = $con->prepare(
        "INSERT INTO meal_nutrition_tbl (meal_id, calories, protein, carbs, fat, last_updated)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
            calories=VALUES(calories),
            protein=VALUES(protein),
            carbs=VALUES(carbs),
            fat=VALUES(fat),
            last_updated=NOW()"
    );
    $stmt->bind_param(
        "idddd",
        $meal_id,
        $totals['calories'],
        $totals['protein'],
        $totals['carbs'],
        $totals['fat']
    );
    $ok = $stmt->execute();
    $stmt->close();
    return $ok;
}


/* ---------------- PURCHASE MEAL FUNCTION ---------------- */

function purchaseMeal($user_id, $meal_id) {
    global $con;
    
    // Begin transaction
    mysqli_begin_transaction($con);
    
    try {
        // ✅ Get meal price
        $meal_query = "SELECT price_coins, name FROM meals_tbl WHERE meal_id = ?";
        $stmt = mysqli_prepare($con, $meal_query);
        mysqli_stmt_bind_param($stmt, "i", $meal_id);
        mysqli_stmt_execute($stmt);
        $meal_result = mysqli_stmt_get_result($stmt);
        
        if (mysqli_num_rows($meal_result) === 0) {
            throw new Exception("Meal not found");
        }
        
        $meal = mysqli_fetch_assoc($meal_result);
        $price = $meal['price_coins'];
        $meal_name = $meal['name'];
        
        // ✅ Get user's current coins
        $user_query = "SELECT coins FROM users_tbl WHERE user_id = ?";
        $stmt = mysqli_prepare($con, $user_query);
        mysqli_stmt_bind_param($stmt, "i", $user_id);
        mysqli_stmt_execute($stmt);
        $user_result = mysqli_stmt_get_result($stmt);
        
        if (mysqli_num_rows($user_result) === 0) {
            throw new Exception("User not found");
        }
        
        $user = mysqli_fetch_assoc($user_result);
        $current_coins = $user['coins'];
        
        // ✅ Check if user has enough coins
        if ($current_coins < $price) {
            throw new Exception("Insufficient coins. You need $price coins but have $current_coins.");
        }
        
        // ✅ Check if already owned
        $check_query = "SELECT inventory_id FROM user_inventory_tbl WHERE user_id = ? AND meal_id = ?";
        $stmt = mysqli_prepare($con, $check_query);
        mysqli_stmt_bind_param($stmt, "ii", $user_id, $meal_id);
        mysqli_stmt_execute($stmt);
        $check_result = mysqli_stmt_get_result($stmt);
        
        if (mysqli_num_rows($check_result) > 0) {
            throw new Exception("You already own this meal!");
        }
        
        // ✅ Deduct coins
        $new_balance = $current_coins - $price;
        $update_query = "UPDATE users_tbl SET coins = ? WHERE user_id = ?";
        $stmt = mysqli_prepare($con, $update_query);
        mysqli_stmt_bind_param($stmt, "ii", $new_balance, $user_id);
        
        if (!mysqli_stmt_execute($stmt)) {
            throw new Exception("Failed to deduct coins");
        }
        
        // ✅ Add to inventory
        $insert_query = "INSERT INTO user_inventory_tbl (user_id, meal_id) VALUES (?, ?)";
        $stmt = mysqli_prepare($con, $insert_query);
        mysqli_stmt_bind_param($stmt, "ii", $user_id, $meal_id);
        
        if (!mysqli_stmt_execute($stmt)) {
            throw new Exception("Failed to add to inventory");
        }
        
        // ✅ Commit transaction
        mysqli_commit($con);
        
        return [
            'status' => 200,
            'message' => "Successfully purchased $meal_name!",
            'new_balance' => $new_balance,
            'meal_name' => $meal_name
        ];
        
    } catch (Exception $e) {
        // Rollback on error
        mysqli_rollback($con);
        
        return [
            'status' => 400,
            'message' => $e->getMessage()
        ];
    }
}

/* ============================================
   🖼️ IMAGE FETCHING FUNCTIONS (2-LAYER SYSTEM)
   ============================================ */

/**
 * ✅ LAYER 1: Fetch matching food image from Unsplash API
 * @param string $mealName - Name of the meal
 * @return string|null - Image URL or null if failed
 */
function fetchUnsplashImage($mealName) {
    $searchTerm = cleanMealNameForSearch($mealName);
    
    // ✅ YOUR UNSPLASH ACCESS KEY
    $unsplashKey = 'l7qVjOEtmcTJTd1_F9Cs3U91pydWICJ9gANNT6IXMLE';
    
    $query = urlencode($searchTerm . " food dish");
    $url = "https://api.unsplash.com/search/photos?query={$query}&per_page=1&orientation=landscape&client_id={$unsplashKey}";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Laccrion-Meal-App');
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        if (!empty($data['results'][0]['urls']['regular'])) {
            error_log("✅ [Layer 1] Unsplash image found for: $mealName");
            return $data['results'][0]['urls']['regular'];
        }
    }
    
    error_log("⚠️ [Layer 1] Unsplash failed for: $mealName - Using gradient placeholder");
    return null;
}

/**
 * ✅ ❌ REMOVED: fetchFoodishImage() - No longer using random images
 */

/**
 * ✅ LAYER 2: Generate gradient placeholder URL
 * Frontend will handle the actual gradient generation
 * @param string $mealName - Name of the meal
 * @return string - Placeholder indicator
 */
function generateGradientPlaceholder($mealName) {
    return "gradient://" . base64_encode($mealName);
}

/**
 * ✅ UPDATED: Try 2 layers only (Unsplash → Gradient)
 * @param string $mealName - Name of the meal
 * @return string - Image URL (guaranteed to return something)
 */
function fetchFoodImage($mealName) {
    // Layer 1: Try Unsplash (matches meal name)
    $imageUrl = fetchUnsplashImage($mealName);
    if ($imageUrl) return $imageUrl;
    
    // Layer 2: Use gradient placeholder (always works)
    error_log("✅ [Layer 2] Using gradient placeholder for: $mealName");
    return generateGradientPlaceholder($mealName);
}

/**
 * ✅ Clean meal name for better image search
 */
function cleanMealNameForSearch($name) {
    $stopWords = ['grilled', 'baked', 'fried', 'steamed', 'roasted', 'boiled', 'sauteed', 'with', 'and'];
    
    $name = strtolower($name);
    $words = explode(' ', $name);
    
    $filtered = array_filter($words, function($word) use ($stopWords) {
        return !in_array(trim($word), $stopWords) && strlen($word) > 2;
    });
    
    return implode(' ', array_slice($filtered, 0, 3));
}


/* ---------------- WORKOUT PROGRAM FUNCTIONS ---------------- */


/**
 * Calculate random rewards based on workout difficulty
 */
function calculateWorkoutRewards($difficulty) {
    $rewards = [
        'beginner' => ['xp' => [20, 40], 'coins' => [10, 20]],
        'intermediate' => ['xp' => [50, 80], 'coins' => [25, 40]],
        'expert' => ['xp' => [90, 130], 'coins' => [45, 65]]
    ];
    
    $difficulty = strtolower($difficulty);
    $range = $rewards[$difficulty] ?? $rewards['beginner'];
    
    return [
        'xp' => rand($range['xp'][0], $range['xp'][1]),
        'coins' => rand($range['coins'][0], $range['coins'][1])
    ];
}

/**
 * Assign a workout program to user
 */

function addWorkoutProgram($user_id, $workout_id) {
    global $con;
    
    if (!$user_id || !$workout_id) {
        return json_encode([
            'status' => 400,
            'message' => 'Missing user_id or workout_id'
        ]);
    }
    
    // ✅ FIX: Get workout details FIRST (before calculating rewards)
    $stmt = $con->prepare("
        SELECT workout_name, difficulty 
        FROM workout_master_tbl 
        WHERE workout_id = ?
    ");
    $stmt->bind_param("i", $workout_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $workout = $result->fetch_assoc();
    $stmt->close();
    
    // ✅ Check if workout exists
    if (!$workout) {
        return json_encode([
            'status' => 404,
            'message' => 'Workout not found'
        ]);
    }
    
    // ✅ Check if user has ANY pending workouts (first batch only)
    $stmt = $con->prepare("
        SELECT COUNT(*) as count 
        FROM user_workout_programs_tbl 
        WHERE user_id = ? 
        AND status = 'pending'
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $pendingCount = $row['count'];
    $stmt->close();
    
    // ✅ MODIFIED: Allow multiple additions ONLY if it's the first batch
    // If user already has pending workouts from a previous session, block them
    if ($pendingCount > 0) {
        // Check if all pending workouts are from today (first batch being added)
        $today = date('Y-m-d');
        $stmt = $con->prepare("
            SELECT COUNT(*) as count 
            FROM user_workout_programs_tbl 
            WHERE user_id = ? 
            AND status = 'pending'
            AND assigned_date = ?
        ");
        $stmt->bind_param("is", $user_id, $today);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $todayPendingCount = $row['count'];
        $stmt->close();
        
        // If pending count doesn't match today's count, means old workouts exist
        if ($pendingCount > $todayPendingCount) {
            return json_encode([
                'status' => 400,
                'message' => '⚠️ You have unfinished workouts from a previous session! Complete them before adding more.'
            ]);
        }
    }
    
    // Check if already assigned today
    $today = date('Y-m-d');
    $stmt = $con->prepare("
        SELECT program_id 
        FROM user_workout_programs_tbl 
        WHERE user_id = ? 
        AND workout_id = ? 
        AND assigned_date = ? 
        AND status = 'pending'
    ");
    $stmt->bind_param("iis", $user_id, $workout_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $stmt->close();
        return json_encode([
            'status' => 400,
            'message' => 'This workout is already in your active programs'
        ]);
    }
    $stmt->close();
    
    // ✅ NOW calculate rewards (after getting workout details)
    $rewards = calculateWorkoutRewards($workout['difficulty']);
    
    // Insert workout program
    $stmt = $con->prepare("
        INSERT INTO user_workout_programs_tbl 
        (user_id, workout_id, assigned_date, status, xp_earned, coins_earned) 
        VALUES (?, ?, ?, 'pending', ?, ?)
    ");
    $stmt->bind_param("iisii", $user_id, $workout_id, $today, $rewards['xp'], $rewards['coins']);
    
    if ($stmt->execute()) {
        $program_id = $stmt->insert_id;
        $stmt->close();
        
        return json_encode([
            'status' => 200,
            'message' => 'Workout added successfully',
            'program_id' => $program_id,
            'workout_name' => $workout['workout_name'], // ✅ Now this works!
            'xp_reward' => $rewards['xp'],
            'coin_reward' => $rewards['coins']
        ]);
    } else {
        $stmt->close();
        return json_encode([
            'status' => 500,
            'message' => 'Failed to add workout'
        ]);
    }
}

/**
 * Complete a workout program and award XP/Coins
 */
function completeWorkoutProgram($user_id, $program_id) {
    global $con;
    
    // Get workout details
    $stmt = $con->prepare("
        SELECT uwp.workout_id, uwp.xp_earned, uwp.coins_earned, uwp.status,
               w.workout_name
        FROM user_workout_programs_tbl uwp
        JOIN workout_master_tbl w ON uwp.workout_id = w.workout_id
        WHERE uwp.program_id = ? 
        AND uwp.user_id = ?
    ");
    $stmt->bind_param("ii", $program_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $program = $result->fetch_assoc();
    $stmt->close();
    
    if (!$program) {
        return json_encode([
            'status' => 404,
            'message' => 'Workout program not found'
        ]);
    }
    
    if ($program['status'] === 'completed') {
        return json_encode([
            'status' => 400,
            'message' => 'Workout already completed'
        ]);
    }
    
    // Award XP and Coins
    $stmt = $con->prepare("
        UPDATE users_tbl 
        SET xp = xp + ?, coins = coins + ? 
        WHERE user_id = ?
    ");
    $stmt->bind_param("iii", $program['xp_earned'], $program['coins_earned'], $user_id);
    
    if (!$stmt->execute()) {
        $stmt->close();
        return json_encode([
            'status' => 500,
            'message' => 'Failed to award rewards'
        ]);
    }
    $stmt->close();
    
    // Mark workout as completed
    $stmt = $con->prepare("
        UPDATE user_workout_programs_tbl 
        SET status = 'completed', completed_at = NOW() 
        WHERE program_id = ?
    ");
    $stmt->bind_param("i", $program_id);
    $stmt->execute();
    $stmt->close();
    
    // Check for level up
    $levelUpResult = checkAndLevelUp($user_id);
    
    // Get updated stats
    $stats = fetchPlayerStats($user_id);
    
    return json_encode([
        'status' => 200,
        'message' => 'Workout completed!',
        'workout_name' => $program['workout_name'],
        'rewards' => [
            'xp' => $program['xp_earned'],
            'coins' => $program['coins_earned']
        ],
        'level_up' => $levelUpResult,
        'stats' => $stats
    ]);
}

/**
 * Read user's active workout programs
 */
function ReadUserWorkouts($user_id) {
    global $con;
    
    if (!$user_id) {
        return json_encode([
            'status' => 400,
            'message' => 'User ID required'
        ]);
    }
    
    $today = date('Y-m-d');
    
    // Fetch active workout programs assigned today
    $stmt = $con->prepare("
        SELECT 
            uwp.program_id,
            uwp.workout_id,
            w.workout_name,
            w.difficulty,
            w.workoutType,
            w.muscle,
            uwp.xp_earned,
            uwp.coins_earned,
            uwp.status,
            uwp.assigned_date
        FROM user_workout_programs_tbl uwp
        JOIN workout_master_tbl w ON uwp.workout_id = w.workout_id
        WHERE uwp.user_id = ? 
        AND uwp.assigned_date = ?
        AND uwp.status = 'pending'
        ORDER BY uwp.assigned_date DESC
    ");
    $stmt->bind_param("is", $user_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $workouts = [];
    while ($row = $result->fetch_assoc()) {
        $workouts[] = [
            'program_id' => $row['program_id'],
            'workout_id' => $row['workout_id'],
            'workout_name' => $row['workout_name'],
            'difficulty' => $row['difficulty'],
            'type' => $row['workoutType'],
            'muscle' => $row['muscle'],
            'xp_reward' => $row['xp_earned'],
            'coin_reward' => $row['coins_earned'],
            'status' => $row['status']
        ];
    }
    $stmt->close();
    
    if (count($workouts) === 0) {
        return json_encode([
            'status' => 200,
            'message' => 'No active workout programs',
            'workouts' => []
        ]);
    }
    
    return json_encode([
        'status' => 200,
        'workouts' => $workouts
    ]);
}