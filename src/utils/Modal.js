import React, { useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Modalize } from 'react-native-modalize';
import Colors from '../../assets/colors';

const TutorModal = forwardRef((props, ref) => {
  const modalRef = useRef(null);
  const [selectedTutor, setSelectedTutor] = useState('basic'); // ✅ Default is BASIC

  useImperativeHandle(ref, () => ({
    openModal: () => {
      setSelectedTutor('basic'); // ✅ Reset to Basic every time modal opens
      modalRef.current?.open();
    },
    closeModal: () => modalRef.current?.close(),
  }));

  const handleConfirm = () => {
  const usermode = selectedTutor === 'expert' ? 'premium' : 'basic';
  props.onTutorSelect && props.onTutorSelect(usermode);

    modalRef.current?.close();
  };

  return (
    <Modalize
      ref={modalRef}
      modalHeight={400}
      snapPoint={350}
      handlePosition="inside"
      modalStyle={styles.modalBox}
      handleStyle={styles.handle}
      onClosed={() => setSelectedTutor('basic')} // ✅ Reset after closing gesture
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Pick Your Tutor</Text>

        <TouchableOpacity
          style={[
            styles.optionBox,
            selectedTutor === 'basic' && styles.optionBoxSelected,
          ]}
          onPress={() => setSelectedTutor('basic')}
        >
          <View style={styles.optionLeft}>
            <Text style={styles.optionTitle}>Basic Tutor</Text>
            <Text style={styles.optionSubtitle}>Free</Text>
          </View>
          <Text style={styles.optionRight}>⚡ Fast Start</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionBox,
            selectedTutor === 'expert' && styles.optionBoxSelected,
          ]}
          onPress={() => setSelectedTutor('expert')}
        >
          <View style={styles.optionLeft}>
            <Text style={styles.optionTitle}>Expert Tutor</Text>
            <Text style={styles.optionSubtitle}>Pro</Text>
          </View>
          <Text style={styles.optionRight}>🎓 Clearer, Smarter, More Accurate</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </Modalize>
  );
});

export default TutorModal;

const styles = StyleSheet.create({
  modalBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#fff',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginVertical: 8,
  },
  modalContent: { padding: 24 },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 20,
    textAlign: 'center',
  },
  optionBox: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionBoxSelected: {
    borderColor: Colors.red,
    backgroundColor: '#fff4f4',
  },
  optionLeft: {},
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  optionSubtitle: {
    fontSize: 13,
    color: Colors.darkgray,
  },
  optionRight: {
    fontSize: 13,
    color: Colors.darkgray,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  confirmBtn: {
    backgroundColor: Colors.red,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});
