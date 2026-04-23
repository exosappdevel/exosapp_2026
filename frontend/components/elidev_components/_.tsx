import { Children, Dispatch, SetStateAction, useEffect, useState } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    Modal, Platform, Alert, Switch, TouchableWithoutFeedback,
    Keyboard, Pressable, ImageBackground
} from "react-native";

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import CustomModal from '../../components/CustomModal';
import { Href } from 'expo-router';
import { iMenuItem } from "@/context/AppmenuItems";
import ApiService from "../../services/ApiServices";
import { PanResponder, Animated } from 'react-native';
import * as FileSystem from 'expo-file-system';
import {hexToRGBA} from './_Functions'
