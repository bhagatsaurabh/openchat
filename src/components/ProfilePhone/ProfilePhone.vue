<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { AuthErrorCodes, PhoneAuthProvider } from 'firebase/auth';

import { msInADay } from '@/utils/constants';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import InputText from '@/components/Common/InputText/InputText.vue';
import Icon from '@/components/Common/Icon/Icon.vue';
import Button from '@/components/Common/Button/Button.vue';
import Recaptcha from '@/components/Common/Recaptcha/Recaptcha.vue';
import CountryInput from '../CountryInput/CountryInput.vue';

const phoneUtil = window.libphonenumber.PhoneNumberUtil.getInstance();
const auth = useAuthStore();
const notify = useNotificationStore();

const countryCode = ref(null);
const phone = ref(auth.profile.phone);
const phoneEl = ref(null);
const code = ref(null);
const codeEl = ref(null);
const verified = ref(!!phone.value);
const naLabel = ref('Not Available');
const captcha = ref(null);
const isVerifying = ref(false);
const showResendCaptcha = ref(false);
const vrfnId = ref(null);
const step = ref(0);
const isBusy = ref(false);
const timerHandle = ref(-1);
const countDown = ref(30);

const daysRmng = computed(() =>
  Math.ceil((new Date(+auth.user.metadata.createdAt + msInADay * 30) - Date.now()) / msInADay)
);

const validatePhone = (val) => {
  if (!val) return 'Provide a phone number';
  try {
    if (!phoneUtil.isValidNumber(phoneUtil.parse(`+${countryCode.value}${val}`))) {
      return 'Enter a valid phone number';
    }
    return null;
  } catch (error) {
    return 'Enter a valid phone number';
  }
};
const validateCode = (val) => {
  if (!val) return 'Provide the 6 digit code';
  if (isNaN(parseInt(val)) || val.toString().length !== 6) {
    return 'Enter a valid code';
  }
  return null;
};
const handleVerify = async () => {
  isBusy.value = true;
  // Give a chance for Verify button to show the spinner before its hidden
  await nextTick();

  // Delay to next event cycle
  setTimeout(() => {
    isVerifying.value = true;
    isBusy.value = false;
  }, 0);
};
const handleVerified = () => {
  step.value = 0;
  phone.value = auth.profile.phone;
  verified.value = true;
};
const handleSubmit = async () => {
  isBusy.value = true;
  if (step.value === 0) {
    if (!phoneEl.value.validate(phone.value) && captcha.value.validate()) {
      try {
        vrfnId.value = await auth.verifyGuestUser('phone', {
          countryCode: countryCode.value,
          phone: phone.value
        });
        step.value = 1;
      } catch (error) {
        if (error.code === AuthErrorCodes.CAPTCHA_CHECK_FAILED) {
          captcha.value.invalidate('Captcha check failed, please try again');
        }
      }
    }
  } else if (step.value === 1) {
    if (!codeEl.value.validate(code.value)) {
      try {
        await auth.verifyGuestUser('code', { code: code.value, verificationId: vrfnId.value });
        handleVerified();
      } catch (error) {
        if (error.code === AuthErrorCodes.INVALID_CODE) {
          codeEl.value.invalidate('Wrong code. Try again');
        } else if (error.code === AuthErrorCodes.CODE_EXPIRED) {
          codeEl.value.invalidate('Code expired, request a new one');
        } else if (error.code === AuthErrorCodes.NEED_CONFIRMATION) {
          const res = await auth.linkGuestUser(PhoneAuthProvider.credentialFromError(error));
          if (res === 'fatal') {
            handleCancel();
          } else if (res === 'ok') {
            handleVerified();
          }
        } else {
          notify.push({
            type: 'snackbar',
            status: 'warn',
            message: 'Something went wrong, please try again'
          });
        }
      }
    }
  }
  isBusy.value = false;
};
const handleCancel = () => {
  step.value = 0;
  vrfnId.value = null;
  isVerifying.value = false;
  countDown.value = 30;
  clearInterval(timerHandle.value);
  phone.value = null;
  code.value = null;
};
const handleResend = async () => {
  isBusy.value = true;
  showResendCaptcha.value = true;
  try {
    vrfnId.value = await auth.verifyGuestUser('phone', {
      countryCode: countryCode.value,
      phone: phone.value
    });
    showResendCaptcha.value = false;
    startResendTimer();
  } catch (error) {
    if (error.code === AuthErrorCodes.CAPTCHA_CHECK_FAILED) {
      captcha.value.invalidate('Captcha check failed, please try again');
    }
  }
  isBusy.value = false;
};
const startResendTimer = () => {
  countDown.value = 30;
  clearInterval(timerHandle.value);
  timerHandle.value = setInterval(() => {
    countDown.value -= 1;
    if (countDown.value < 0) clearInterval(timerHandle.value);
  }, 1000);
};

watch(step, () => step.value === 1 && startResendTimer());

onBeforeUnmount(() => clearTimeout(timerHandle.value));
</script>

<template>
  <section class="profile-phone">
    <div class="content">
      <Transition name="fade-slide-ltr" appear>
        <div class="card" v-if="step === 0">
          <div v-if="verified || isVerifying" class="phone-input">
            <CountryInput v-if="!verified" @select="(country) => (countryCode = country[2])" />
            <InputText
              class="input"
              ref="phoneEl"
              type="text"
              placeholder="Phone"
              v-model="phone"
              :attrs="{ spellcheck: false, autocomplete: 'off', disabled: verified }"
              :validator="validatePhone"
              :action="handleSubmit"
              @cancel="handleCancel"
              focus
              :async="!verified"
              :cancellable="!verified"
            />
          </div>
          <template v-if="isVerifying">
            <div><Recaptcha ref="captcha" /></div>
            <div class="notice">
              <span> By tapping Verify, an SMS may be sent. Message & data rates may apply. </span>
            </div>
          </template>
          <div class="phone-input-unverified" v-show="!(verified || isVerifying)">
            <InputText
              class="input mr-1"
              type="text"
              placeholder="Phone"
              v-model="naLabel"
              :attrs="{ disabled: true }"
            />
            <Button @click="handleVerify" :complementary="false" :busy="isBusy" async accented>Verify</Button>
          </div>
          <div v-if="!(verified || isVerifying)" class="unverified">
            <Icon class="mr-0p5" name="warn" alt="warn icon" singular />
            <h3>Unverified account, expires in {{ daysRmng }} days</h3>
          </div>
        </div>
      </Transition>
      <Transition name="fade-slide-ltr">
        <div class="card phone-verify" v-if="step === 1">
          <InputText
            class="input"
            ref="codeEl"
            type="number"
            placeholder="6 digit code"
            v-model="code"
            :attrs="{ spellcheck: false, autocomplete: 'off', maxlength: 6 }"
            :validator="validateCode"
            :action="handleSubmit"
            @cancel="handleCancel"
            focus
            async
            cancellable
          />
          <div><Recaptcha v-if="showResendCaptcha" ref="captcha" /></div>
          <Button
            class="resend-control"
            :disabled="countDown >= 0"
            @click="handleResend"
            :complementary="false"
            :busy="isBusy"
            async
          >
            <span>Resend Code</span>
            <span v-if="countDown >= 0">&nbsp;in 0:{{ countDown }}</span>
          </Button>
        </div>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
.content {
  display: flex;
  align-items: flex-start;
}
.content .card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.content .card .input {
  width: 100%;
}

.phone-input {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
}
.phone-input .input {
  width: unset !important;
  flex: 1;
}
.phone-input-unverified {
  display: flex;
  align-items: center;
}

.unverified {
  color: rgb(253, 112, 112);
  display: flex;
  align-items: center;
  margin-top: 1rem;
}
.unverified h3 {
  display: inline-block;
}
.unverified span {
  font-size: 0;
}
.resend-control {
  float: right;
}
.notice {
  margin-top: 1rem;
  color: var(--c-text-2);
}
</style>
